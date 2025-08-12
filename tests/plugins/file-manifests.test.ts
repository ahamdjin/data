import { describe, it, expect, beforeAll } from "vitest";
import { loadPlugins, listConnectors } from "@/plugins/registry";

describe("File connectors", () => {
  beforeAll(async () => { await loadPlugins(); });

  it("registers s3, gcs, azure-blob", () => {
    const ids = listConnectors().map(c => c.spec.id);
    expect(ids).toContain("s3");
    expect(ids).toContain("gcs");
    expect(ids).toContain("azure-blob");
  });
});
