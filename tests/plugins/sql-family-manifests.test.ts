import { describe, it, expect, beforeAll } from "vitest";
import { loadPlugins, listConnectors } from "@/plugins/registry";

describe("SQL family manifests", () => {
  beforeAll(async () => { await loadPlugins(); });

  it("registers mysql and sqlite", () => {
    const ids = listConnectors().map(c => c.spec.id);
    expect(ids).toContain("mysql");
    expect(ids).toContain("sqlite");
  });
});
