import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { env } from "@/config/env";
import { AnyJob, ConnectorIngestZ } from "./jobs";
import { DATAI_QUEUE_NAME } from "./queue";
import { withTenant } from "@/db/withTenant";
import { getAdapter } from "@/db/registry";
import { loadPlugins, getConnector } from "@/plugins/registry";

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

async function route(job: Job<AnyJob>) {
  switch (job.data.type) {
    case "connector.ingest":
      return processConnectorIngest(job);
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
