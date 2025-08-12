import { z } from "zod";

export const MongoQueryZ = z.object({
  collection: z.string().min(1),
  filter: z.record(z.any()).default({}),
  projection: z.record(z.any()).optional(),
  sort: z.record(z.any()).optional(),
  limit: z.number().int().positive().max(1000).default(100),
});

export type MongoQuery = z.infer<typeof MongoQueryZ>;

export const FirestoreQueryZ = z.object({
  collection: z.string().min(1),      // e.g., "users"
  where: z.array(z.tuple([
    z.string().min(1),                 // field
    z.enum(["==","!=","<","<=",">",">=","in","array-contains","array-contains-any"]).default("=="),
    z.any(),                           // value
  ])).default([]),
  orderBy: z.tuple([z.string(), z.enum(["asc","desc"]).default("asc")]).optional(),
  limit: z.number().int().positive().max(1000).default(100),
});

export type FirestoreQuery = z.infer<typeof FirestoreQueryZ>;
