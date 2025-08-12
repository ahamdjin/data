import { describe, it, expect } from "vitest";
import { getAdapter } from "@/db/registry";
import { queue } from "@/queue/queue";

async function insertOrg(name = "Idem Org") {
  const db = getAdapter("default");
  const [o] = await db.query<{ id: string }>(
    "INSERT INTO organizations (name) VALUES ($1) RETURNING id",
    [name]
  );
  return o.id;
}

const run = process.env.DATABASE_URL ? it : it.skip;

describe("jobs idempotency", () => {
  run("reuses the same job id for same (orgId, idempotencyKey)", async () => {
    const db = getAdapter("default");
    const orgId = await insertOrg();

    const payload = {
      type: "connector.ingest" as const,
      orgId,
      connectorId: "postgres-basic",
      config: { databaseName: "default" },
      source: "default",
      idempotencyKey: "demo-key-123",
    };

    const [audit1] = await db.query<{ id: string }>(
      `INSERT INTO jobs (organization_id, type, status, progress, payload, idempotency_key)
       VALUES ($1, $2, 'queued', 0, $3::jsonb, $4)
       ON CONFLICT (organization_id, idempotency_key) DO UPDATE
         SET updated_at = now()
       RETURNING id`,
      [orgId, payload.type, JSON.stringify(payload), payload.idempotencyKey]
    );

    const [audit2] = await db.query<{ id: string }>(
      `INSERT INTO jobs (organization_id, type, status, progress, payload, idempotency_key)
       VALUES ($1, $2, 'queued', 0, $3::jsonb, $4)
       ON CONFLICT (organization_id, idempotency_key) DO UPDATE
         SET updated_at = now()
       RETURNING id`,
      [orgId, payload.type, JSON.stringify(payload), payload.idempotencyKey]
    );

    expect(audit1.id).toBeTruthy();
    expect(audit2.id).toBe(audit1.id);

    const rows = await db.query<{ cnt: number }>(
      `SELECT COUNT(*)::int as cnt
         FROM jobs
        WHERE organization_id = $1 AND idempotency_key = $2`,
      [orgId, payload.idempotencyKey]
    );
    expect(rows[0].cnt).toBe(1);

    if (queue) {
      const job = await queue.add(payload.type, payload, { jobId: audit1.id });
      expect(job.id).toBe(audit1.id);
    }
  });
});
