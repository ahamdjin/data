import { describe, it, expect, beforeAll } from "vitest";
import { loadPlugins, listConnectors } from "@/plugins/registry";

describe("SQL family manifests", () => {
  beforeAll(async () => { await loadPlugins(); });

  it("registers mysql and sqlite", () => {
    const specs = listConnectors().map(c => c.spec);
    const mysql = specs.find(s => s.id === "mysql");
    const sqlite = specs.find(s => s.id === "sqlite");
    expect(mysql).toBeTruthy();
    expect(sqlite).toBeTruthy();
    expect(mysql?.capabilities).toEqual(["sql", "json", "fulltext"]);
    expect(sqlite?.capabilities).toEqual(["sql", "json", "fulltext"]);
  });
});
