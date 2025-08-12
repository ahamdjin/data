import { describe, it, expect } from "vitest";
import { flattenResource } from "@/connectors/fhir/flatten";

describe("flattenResource", () => {
  it("Patient", () => {
    const { title, text } = flattenResource({
      resourceType: "Patient",
      id: "p1",
      name: [{ given:["Ada"], family:"Lovelace" }],
      gender: "female",
      birthDate: "1815-12-10"
    });
    expect(title).toContain("Patient/p1");
    expect(text).toMatch(/name:/);
  });
});
