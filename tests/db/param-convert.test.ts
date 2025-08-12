import { describe, it, expect } from "vitest";
import { toBqNamedParams } from "@/db/sql/bigquery";
import { toQuestionParams } from "@/db/sql/paramstyle";

describe("param conversion", () => {
  it("bigquery: $n → @pn", () => {
    const { q, named } = toBqNamedParams("SELECT * FROM T WHERE a=$1 AND b=$2::int", [10, 20]);
    expect(q).toContain("a=@p1");
    expect(q).toContain("b=@p2");
    expect(named).toEqual({ p1: 10, p2: 20 });
  });

  it("snowflake: $n → ?", () => {
    const { q, args } = toQuestionParams("SELECT * FROM T WHERE a=$1 AND b=$2::text", [10, "x"]);
    expect(q.match(/\?/g)?.length).toBe(2);
    expect(args).toEqual([10, "x"]);
  });
});
