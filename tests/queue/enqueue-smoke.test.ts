import { describe, it, expect } from "vitest";

const run = process.env.REDIS_URL && process.env.DATABASE_URL ? it : it.skip;

describe("enqueue smoke", () => {
  run("enqueues a job", async () => {
    const { queue } = await import("@/queue/queue");
    const { getAdapter } = await import("@/db/registry");

    const db = getAdapter("default");
    const [{ id: orgId }] = await db.query<{ id: string }>(
      "INSERT INTO organizations (name) VALUES ($1) RETURNING id",
      ["Test Org"]
    );

    const job = await queue.add("connector.ingest", {
      type: "connector.ingest",
      orgId,
      connectorId: "postgres-basic",
      config: { databaseName: "default" },
      source: "default",
    }, { removeOnComplete: true });
    expect(job.id).toBeTruthy();
  });
});
