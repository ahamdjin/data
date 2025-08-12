import { describe, it, expect } from "vitest";
import { childLogger } from "@/observability/logger";

describe("logger", () => {
  it("creates child with bindings", () => {
    const log = childLogger({ requestId: "abc123", orgId: "org" });
    expect(typeof log.info).toBe("function");
  });
});
