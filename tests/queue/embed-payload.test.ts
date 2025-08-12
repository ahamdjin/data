import { describe, it, expect } from "vitest";
import { DatasetEmbedZ } from "@/queue/jobs";

describe("DatasetEmbedZ", () => {
  it("validates", () => {
    const v = DatasetEmbedZ.safeParse({
      type: "dataset.embed",
      orgId: "00000000-0000-0000-0000-000000000000",
      datasetId: "00000000-0000-0000-0000-000000000000",
      batchSize: 32,
    });
    expect(v.success).toBe(true);
  });
});
