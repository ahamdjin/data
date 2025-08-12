import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { env } from "@/config/env";
import { AnyJob, ConnectorIngestZ, DatasetEmbedZ, FilesIngestZ } from "./jobs";
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
