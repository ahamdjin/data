/* @vitest-environment node */
import { describe, it, expect } from "vitest";
import { parseImageToChunks } from "@/files/parsers/ocr";

describe("ocr parser", () => {
  it("is a function", () => {
    expect(typeof parseImageToChunks).toBe("function");
  });

  it.skip("recognizes text in image", async () => {
    // heavy test skipped by default
    const png = Buffer.from([]);
    await parseImageToChunks(png);
  });
});
