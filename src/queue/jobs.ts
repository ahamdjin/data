import { z } from "zod";

export type JobType = "connector.ingest" | "dataset.embed" | "schema.sync" | "files.ingest" | "fhir.ingest";

export const BaseJobZ = z.object({
  orgId: z.string().uuid(),
  idempotencyKey: z.string().optional(),
});

export const ConnectorIngestZ = BaseJobZ.extend({
  type: z.literal("connector.ingest"),
  connectorId: z.string().min(1),
  config: z.record(z.any()).default({}),
  source: z.string().default("default"),
  options: z.record(z.any()).optional(),
});

export type ConnectorIngest = z.infer<typeof ConnectorIngestZ>;

export const DatasetEmbedZ = BaseJobZ.extend({
  type: z.literal("dataset.embed"),
  datasetId: z.string().uuid(),
  batchSize: z.number().int().positive().max(256).default(64),
});

export type DatasetEmbed = z.infer<typeof DatasetEmbedZ>;

export const FilesIngestZ = BaseJobZ.extend({
  type: z.literal("files.ingest"),
  connectorId: z.enum(["s3","gcs","azure-blob"]),
  config: z.record(z.any()).default({}),
  // Source params are connector-specific but standardized here:
  source: z.string().min(1),
  options: z.record(z.any()).default({}),
  datasetId: z.string().uuid(),
  enqueueEmbed: z.boolean().default(false),
});

export type FilesIngest = z.infer<typeof FilesIngestZ>;

export const FhirIngestZ = BaseJobZ.extend({
  type: z.literal("fhir.ingest"),
  datasetId: z.string().uuid(),
  config: z.record(z.any()),
  mode: z.enum(["bulk","search"]).default("bulk"),
  scope: z.object({
    level: z.enum(["system","patient","group"]).default("system"),
    id: z.string().optional()
  }).default({ level: "system" }),
  resourceTypes: z.array(z.string()).default(["Patient","Condition","Observation","Encounter","DocumentReference"]),
  since: z.string().datetime().optional(),
  pageSize: z.number().int().positive().max(2000).default(200),
});

export type FhirIngest = z.infer<typeof FhirIngestZ>;

export const AnyJobZ = z.discriminatedUnion("type", [
  ConnectorIngestZ,
  DatasetEmbedZ,
  FilesIngestZ,
  FhirIngestZ,
]);

export type AnyJob = z.infer<typeof AnyJobZ>;
