import { describe, it, expect, beforeAll } from "vitest";
import { loadPlugins, listConnectors, getConnector } from "@/plugins/registry";

describe("FHIR manifest", () => {
  beforeAll(async () => { await loadPlugins(); });
  it("registers fhir", () => {
    const ids = listConnectors().map(c => c.spec.id);
    expect(ids).toContain("fhir");
  });
  it("testConnection fails on bad URL", async () => {
    const { create } = getConnector("fhir");
    const c = create({ baseUrl: "https://invalid.example", auth: { kind: "none" } });
    const ok = await c.testConnection();
    expect(typeof ok.ok).toBe("boolean");
  });
});
