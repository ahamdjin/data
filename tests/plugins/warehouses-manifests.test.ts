import { describe, it, expect, beforeAll } from "vitest";
import { loadPlugins, listConnectors } from "@/plugins/registry";

describe("Warehouse manifests", () => {
  beforeAll(async () => { await loadPlugins(); });

  it("registers bigquery and snowflake", () => {
    const ids = listConnectors().map(c => c.spec.id);
    expect(ids).toContain("bigquery");
    expect(ids).toContain("snowflake");
  });
});
