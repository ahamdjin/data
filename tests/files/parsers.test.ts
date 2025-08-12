/* @vitest-environment node */
import { describe, it, expect } from "vitest";
import { detectKindFromPath } from "@/files/detect";
import { parseCsv } from "@/files/parsers/csv";
import { Readable } from "node:stream";

describe("detect", () => {
  it("detects by extension", () => {
    expect(detectKindFromPath("a.csv")).toBe("csv");
    expect(detectKindFromPath("b.parquet")).toBe("parquet");
    expect(detectKindFromPath("c.txt")).toBe("text");
  });
});

describe("csv parser", () => {
  it("yields rows", async () => {
    const input = Readable.from("a,b\n1,2\n3,4\n");
    const rows: any[] = [];
    for await (const r of parseCsv(input, { headers: true })) rows.push(r);
    expect(rows.length).toBe(2);
    expect(rows[0]).toEqual({ a: "1", b: "2" });
  });
});
