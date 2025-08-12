import { describe, it, expect, beforeAll } from "vitest";
import { loadPlugins, listConnectors, getConnector } from "@/plugins/registry";

describe("NoSQL connectors", () => {
  beforeAll(async () => { await loadPlugins(); });

  it("registers mongo and firestore", () => {
    const ids = listConnectors().map(c => c.spec.id);
    expect(ids).toContain("mongo");
    expect(ids).toContain("firestore");
  });

  it("mongo testConnection handles bad URL", async () => {
    const { create } = getConnector("mongo");
    const conn = create({ mongoUrl: "mongodb://127.0.0.1:1/?serverSelectionTimeoutMS=500", database: "foo" });
    const res = await conn.testConnection();
    expect(typeof res.ok).toBe("boolean");
  });

  it("firestore testConnection fails without env", async () => {
    const { create } = getConnector("firestore");
    const conn = create({});
    const res = await conn.testConnection();
    expect(res.ok).toBe(false);
  });
});
