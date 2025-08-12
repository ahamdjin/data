import { describe, it, expect } from "vitest";
import { chunkText } from "@/ingest/chunker";

describe("chunkText", () => {
  it("produces overlapping chunks", () => {
    const text = "a".repeat(1000);
    const chunks = chunkText(text, { maxTokens: 200, overlap: 50 });
    expect(chunks.length).toBeGreaterThan(4);
    expect(chunks[0].content.length).toBe(200);
    expect(chunks[1].content.startsWith("a".repeat(150))).toBe(true);
  });
});
