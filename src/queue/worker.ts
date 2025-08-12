import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { env } from "@/config/env";
import { AnyJob, ConnectorIngestZ, DatasetEmbedZ, FilesIngestZ, FhirIngestZ } from "./jobs";
import { DATAI_QUEUE_NAME } from "./queue";
import { withTenant } from "@/db/withTenant";
import { getAdapter } from "@/db/registry";
import { loadPlugins, getConnector } from "@/plugins/registry";
import { queue } from "./queue";
import { getVectorStore } from "@/vector/registry";
import { getEmbedder } from "@/embedding/registry";
import { startOtelOnce } from "@/observability/otel";
import { childLogger } from "@/observability/logger";
import { getTraceIds } from "@/observability/correlation";
import { auditLlmCall } from "@/observability/audit";
import { flattenResource } from "@/connectors/fhir/flatten";
import { chunkText } from "@/ingest/chunker";
import { saveDocumentWithChunksDedup } from "@/ingest/saveDocumentWithChunksDedup";
import { startBulkExport, pollBulkReady, downloadBulkFiles, ndjsonLines, getJSON } from "@/connectors/fhir/client";
import crypto from "node:crypto";

await startOtelOnce();

// Create Redis connection only when configured so builds can proceed without Redis.
let connection: IORedis | undefined;
if (env.server.REDIS_URL) {
  connection = new IORedis(env.server.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

function setProgress(job: Job, p: number) {
  const pct = Math.max(0, Math.min(100, Math.round(p)));
  return job.updateProgress(pct);
}

async function updateAudit(job: Job, patch: Partial<{ status: string; progress: number; result: any; error: string }>) {
  const db = getAdapter("default");
  const { id } = job;
  const fields = [] as string[];
  const vals: any[] = [];
  if (patch.status) { fields.push(`status = $${fields.length + 1}`); vals.push(patch.status); }
  if (typeof patch.progress === "number") { fields.push(`progress = $${fields.length + 1}`); vals.push(patch.progress); }
  if (typeof patch.result !== "undefined") { fields.push(`result = $${fields.length + 1}::jsonb`); vals.push(JSON.stringify(patch.result)); }
  if (patch.error) { fields.push(`error = $${fields.length + 1}`); vals.push(patch.error); }
  if (!fields.length) return;
  await db.query(`UPDATE jobs SET ${fields.join(", ")}, updated_at = now() WHERE id = $${fields.length + 1}`, [...vals, id]);
}

async function processFhirIngest(job: Job<any>) {
  const payload = FhirIngestZ.parse(job.data);
  const { orgId, datasetId, config, mode, scope, resourceTypes, since, pageSize } = payload;

  return withTenant(orgId, async (db) => {
    const source = `fhir:${config.baseUrl}`;
    const [cur] = await db.query<any>(`SELECT * FROM ingest_cursors WHERE dataset_id=$1 AND source=$2 AND mode=$3`, [datasetId, source, mode]);

    let total = 0;

    if (mode === "bulk") {
      let pollUrl = cur?.resume_url;
      if (!pollUrl) {
        const { pollUrl: p } = await startBulkExport(config.baseUrl, config.auth, scope, resourceTypes, since);
        pollUrl = p;
        await db.query(
          `INSERT INTO ingest_cursors (organization_id, dataset_id, source, mode, resource_types, since, resume_url, resume_next)
           VALUES (app.get_current_org(), $1, $2, $3, $4, $5, $6, NULL)
           ON CONFLICT (organization_id, dataset_id, source, mode) DO UPDATE SET resume_url = EXCLUDED.resume_url, updated_at = now()`,
          [datasetId, source, mode, resourceTypes, since ?? null, pollUrl]
        );
      }

      const ready = await pollBulkReady(pollUrl, config.auth);
      let processed = 0;
      for await (const file of downloadBulkFiles(ready.output || [], config.auth)) {
        for await (const line of ndjsonLines(file.response)) {
          const obj = JSON.parse(line);
          const res = obj.resourceType ? obj : (obj.resource ?? obj);
          const { title, text } = flattenResource(res);
          const json = JSON.stringify(res);
          const sha1 = crypto.createHash("sha1").update(json).digest("hex");
          const chunks = chunkText(text, { maxTokens: 3500, overlap: 150 });

          await saveDocumentWithChunksDedup({
            orgId, datasetId,
            source: `${source}/${res.resourceType}/${res.id ?? crypto.randomUUID()}`,
            title, mimeType: "application/fhir+json",
            contentSha1: sha1, rawBytesLen: Buffer.byteLength(json),
            sourceEtag: null, sourceMtime: res.meta?.lastUpdated ? new Date(res.meta.lastUpdated) : null,
            chunks
          });

          processed++;
          total++;
          if (processed % 500 === 0) await job.updateProgress(Math.min(99, processed % 10000));
        }
      }

      const newSince = new Date().toISOString();
      await db.query(
        `UPDATE ingest_cursors SET resume_url=NULL, since=$1, updated_at=now() WHERE organization_id=app.get_current_org() AND dataset_id=$2 AND source=$3 AND mode=$4`,
        [newSince, datasetId, source, mode]
      );
    } else {
      for (const rt of resourceTypes) {
        let nextUrl = cur?.resume_next || `${config.baseUrl}/${rt}?_count=${pageSize}` + (since ? `&_lastUpdated=ge${encodeURIComponent(since)}` : "");
        let pages = 0;

        while (nextUrl && pages < 500) {
          const bundle: any = await getJSON(nextUrl, config.auth);
          const entries: any[] = bundle.entry ?? [];
          for (const e of entries) {
            const res = e.resource;
            if (!res) continue;
            const { title, text } = flattenResource(res);
            const json = JSON.stringify(res);
            const sha1 = crypto.createHash("sha1").update(json).digest("hex");
            const chunks = chunkText(text, { maxTokens: 3500, overlap: 150 });

            await saveDocumentWithChunksDedup({
              orgId, datasetId,
              source: `${source}/${res.resourceType}/${res.id ?? crypto.randomUUID()}`,
              title, mimeType: "application/fhir+json",
              contentSha1: sha1, rawBytesLen: Buffer.byteLength(json),
              sourceEtag: e.response?.etag ?? null,
              sourceMtime: res.meta?.lastUpdated ? new Date(res.meta.lastUpdated) : null,
              chunks
            });
            total++;
          }

          const nextLink = (bundle.link || []).find((l:any)=>l.relation==="next")?.url;
          await db.query(
            `INSERT INTO ingest_cursors (organization_id, dataset_id, source, mode, resource_types, since, resume_url, resume_next)
             VALUES (app.get_current_org(), $1, $2, $3, $4, $5, NULL, $6)
             ON CONFLICT (organization_id, dataset_id, source, mode) DO UPDATE SET resume_next=EXCLUDED.resume_next, updated_at=now()`,
            [datasetId, source, "search", [rt], since ?? null, nextLink ?? null]
          );
          nextUrl = nextLink || null;
          pages++;
          await job.updateProgress(Math.min(99, pages));
          if (!nextUrl) break;
        }
      }
      const newSince = new Date().toISOString();
      await db.query(
        `UPDATE ingest_cursors SET since=$1, resume_next=NULL, updated_at=now() WHERE organization_id=app.get_current_org() AND dataset_id=$2 AND source=$3 AND mode='search'`,
        [newSince, datasetId, source]
      );
    }

    await job.updateProgress(100);
    return { count: total };
  });
}

async function processConnectorIngest(job: Job<AnyJob>) {
  const parsed = ConnectorIngestZ.parse(job.data);
  const { orgId, connectorId, config, source, options } = parsed;

  return withTenant(orgId, async () => {
    await loadPlugins();
    const { create } = getConnector(connectorId);
    const connector = create(config);

    await updateAudit(job, { status: "active", progress: 1 });
    await setProgress(job, 1);

    const res = (await connector.ingest?.({ source, options })) ?? { count: 0 };

    await updateAudit(job, { status: "completed", progress: 100, result: res });
    await setProgress(job, 100);
    return res;
  });
}

async function processDatasetEmbed(job: Job<AnyJob>) {
  const payload = DatasetEmbedZ.parse(job.data);
  const { orgId, datasetId, batchSize } = payload;
  const log = childLogger({ jobId: job.id, orgId });
  log.info({ ...getTraceIds(), datasetId }, "embed job start");

  return withTenant(orgId, async (db) => {
    const store = getVectorStore();
    const embedder = getEmbedder();

    if (store.dim !== embedder.dim) {
      throw new Error(`Embedder dim ${embedder.dim} != store dim ${store.dim}`);
    }

    const batch = await db.query<{ id: string; content: string; ordinal: number }>(
      `SELECT id, content, ordinal
         FROM document_chunks
        WHERE dataset_id = $1 AND embedding IS NULL
        ORDER BY created_at
        LIMIT $2`,
      [datasetId, batchSize]
    );

    if (batch.length === 0) {
      await job.updateProgress(100);
      await db.query(
        `UPDATE jobs SET status = 'completed', progress = 100, updated_at = now() WHERE id = $1`,
        [job.id]
      );
      return { done: true, count: 0 };
    }

    const MAX_PER_CALL = 64;
    const vectors: { id: string; vector: number[] }[] = [];
    for (let i = 0; i < batch.length; i += MAX_PER_CALL) {
      const slice = batch.slice(i, i + MAX_PER_CALL);
      const t0 = Date.now();
      const embeddings = await embedder.embed(slice.map(s => s.content));
      const latency = Date.now() - t0;
      await auditLlmCall({
        orgId,
        model: embedder.name,
        operation: "embed",
        latencyMs: latency,
        meta: { count: slice.length },
      });
      for (let j = 0; j < slice.length; j++) {
        vectors.push({ id: slice[j].id, vector: embeddings[j] });
      }
      await job.updateProgress(Math.min(99, Math.round((i + slice.length) / batchSize * 100)));
    }

    const namespace = `${orgId}:${datasetId}`;
    await store.upsert({ namespace, vectors });

    await db.query(
      `UPDATE jobs SET status = 'active', progress = $2, updated_at = now() WHERE id = $1`,
      [job.id, await job.getProgress()]
    );

    log.info({ count: vectors.length }, "embed batch done");
    return { done: false, count: vectors.length };
  });
}

async function processFilesIngest(job: Job<any>) {
  const payload = FilesIngestZ.parse(job.data);
  const { orgId, connectorId, config, source, options, datasetId, enqueueEmbed } = payload;

  return withTenant(orgId, async () => {
    await loadPlugins();
    const { create } = getConnector(connectorId);
    const conn = create(config);

    await job.updateProgress(1);
    const res = (await conn.ingest?.({ source, options: { ...options, datasetId } })) ?? { count: 0 };
    await job.updateProgress(50);

    if (enqueueEmbed && res.count > 0) {
      await queue.add("dataset.embed", { type: "dataset.embed", orgId, datasetId, batchSize: 64 });
    }

    await job.updateProgress(100);
    return res;
  });
}

async function route(job: Job<AnyJob>) {
  switch (job.data.type) {
    case "connector.ingest":
      return processConnectorIngest(job);
    case "dataset.embed":
      return processDatasetEmbed(job);
    case "files.ingest":
      return processFilesIngest(job);
    case "fhir.ingest":
      return processFhirIngest(job);
    default:
      throw new Error(`Unknown job type: ${(job.data as any).type}`);
  }
}

export const worker = connection
  ? new Worker<AnyJob>(DATAI_QUEUE_NAME, route, {
      connection,
      concurrency: env.server.QUEUE_CONCURRENCY,
    })
  : null;

worker?.on("completed", async () => {
  // no-op
});

worker?.on("failed", async (job, err) => {
  if (!job) return;
  const orgId = (job.data as any).orgId as string | undefined;
  if (orgId) {
    await withTenant(orgId, async () => {
      await updateAudit(job, { status: "failed", error: err?.message ?? "Job failed" });
      return Promise.resolve();
    });
  }
});
