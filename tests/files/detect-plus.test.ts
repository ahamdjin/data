/* @vitest-environment node */
import { describe, it, expect } from "vitest";
import { detectKindFromPath } from "@/files/detect";

describe("detect kind", () => {
  it("maps new extensions", () => {
    expect(detectKindFromPath("a.pdf")).toBe("pdf");
    expect(detectKindFromPath("b.DOCX")).toBe("docx");
    expect(detectKindFromPath("c.html")).toBe("html");
    expect(detectKindFromPath("d.JPG")).toBe("image");
  });
});
