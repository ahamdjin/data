import { describe, it, expect, beforeAll, vi } from "vitest";
import { loadPlugins, listPlugins, listConnectors, getConnector } from "@/plugins/registry";

vi.mock("@/db/registry", () => ({
  getAdapter: () => ({
    query: async (_sql: string) => [{ one: 1 }],
  }),
}));

describe("Plugin runtime", () => {
  beforeAll(async () => {
    await loadPlugins();
  });

  it("loads plugins and connectors", () => {
    const ps = listPlugins();
    expect(ps.length).toBeGreaterThan(0);

    const cs = listConnectors();
    expect(cs.map(c => c.spec.id)).toContain("postgres-basic");
    expect(cs.map(c => c.spec.id)).toContain("custom-http");
  });

  it("can create and use postgres-basic connector", async () => {
    const { create } = getConnector("postgres-basic");
    const conn = create({ databaseName: "default" });
    const ok = await conn.testConnection();
    expect(ok.ok).toBe(true);

    const rows = await conn.query<{ one: number }>({ sql: "SELECT 1 as one" });
    expect(rows[0].one).toBe(1);
  });

  it("handles concurrent loads", async () => {
    vi.resetModules();
    const registry = await import("@/plugins/registry");
    await Promise.all([registry.loadPlugins(), registry.loadPlugins()]);
    const cs = registry.listConnectors();
    expect(cs.map(c => c.spec.id)).toContain("postgres-basic");
  });
});
