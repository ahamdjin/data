import { describe, it, expect } from "vitest";
import { MongoQueryZ, FirestoreQueryZ } from "@/plugins/query-schemas";

describe("query schemas", () => {
  it("accepts a simple mongo query", () => {
    const v = MongoQueryZ.parse({ collection: "users", filter: { active: true }, limit: 10 });
    expect(v.limit).toBe(10);
  });
  it("accepts a simple firestore query", () => {
    const v = FirestoreQueryZ.parse({ collection: "users", where: [["active","==",true]], limit: 5 });
    expect(v.where.length).toBe(1);
  });
});
