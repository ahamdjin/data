import { describe, it, expect } from "vitest";
import { withSpan } from "@/observability/spans";

describe("withSpan", () => {
  it("runs fn and returns", async () => {
    const out = await withSpan("test", { a: 1 }, async () => 42);
    expect(out).toBe(42);
  });
});
