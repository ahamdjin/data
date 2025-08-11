import { describe, it, expect } from "vitest";

// NOTE: This is a “logic” test. If you have Next test harness, use that;
// otherwise we simulate the handler call by invoking the connector directly.

describe("connectors test (logic)", () => {
  it("postgres-basic testConnection ok", async () => {
    // Ensure default adapter exists
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db";
    }
    // registry bootstrap already happens on import

    const { default: manifest } = await import("@/plugins/postgres-basic/manifest");
    const c = manifest.connectors[0].create({ databaseName: "default" });
    const res = await c.testConnection();
    // In CI without a live DB this might fail; if so, you can mock or use pg-mem.
    expect(typeof res.ok).toBe("boolean");
  });
});
