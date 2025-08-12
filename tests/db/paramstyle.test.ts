import { describe, it, expect } from "vitest";
import { toQuestionParams } from "@/db/sql/paramstyle";

describe("toQuestionParams", () => {
  it("replaces $1,$2 with ?", () => {
    const { q, args } = toQuestionParams("SELECT * FROM t WHERE a=$1 AND b=$2::text", [10, "x"]);
    expect(q).toMatch(/a=\?/);
    expect(q).toMatch(/b=\?/);
    expect(args).toEqual([10, "x"]);
  });
});
