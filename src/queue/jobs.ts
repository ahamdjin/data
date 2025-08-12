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

export const AnyJobZ = z.discriminatedUnion("type", [
  ConnectorIngestZ,
]);

export type AnyJob = z.infer<typeof AnyJobZ>;
