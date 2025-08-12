import { z } from "zod";

export type JobType = "connector.ingest" | "dataset.embed" | "schema.sync";

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

export const AnyJobZ = z.discriminatedUnion("type", [
  ConnectorIngestZ,
  DatasetEmbedZ,
]);

export type AnyJob = z.infer<typeof AnyJobZ>;
