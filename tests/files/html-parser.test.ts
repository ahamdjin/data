/* @vitest-environment node */
import { describe, it, expect } from "vitest";
import { parseHtmlToChunks } from "@/files/parsers/html";

describe("html parser", () => {
  it("extracts readable content", () => {
    const html = `<!doctype html><html><head><title>X</title></head><body><article><h1>Hello</h1><p>World</p></article></body></html>`;
    const { title, chunks } = parseHtmlToChunks(html);
    expect(title).toBeTruthy();
    expect(chunks.length).toBeGreaterThan(0);
  });
});
