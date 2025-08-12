import { describe, it, expect } from "vitest";
import { ConnectorIngestZ } from "@/queue/jobs";

describe("ConnectorIngestZ", () => {
  it("validates minimal payload", () => {
    const parsed = ConnectorIngestZ.parse({
      type: "connector.ingest",
      orgId: "00000000-0000-0000-0000-000000000000",
      connectorId: "postgres-basic",
      config: { databaseName: "default" },
    });
    expect(parsed.type).toBe("connector.ingest");
  });

  it("rejects missing orgId", () => {
    expect(() =>
      ConnectorIngestZ.parse({
        type: "connector.ingest",
        connectorId: "postgres-basic",
      })
    ).toThrow();
  });
});
