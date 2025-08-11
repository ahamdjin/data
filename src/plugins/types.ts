import { z } from "zod";

export const CapabilityZ = z.enum([
  "sql",
  "vector",
  "json",
  "fulltext",
  "files",
  "ingest",
  "http",
  "stream",
]);

export type Capability = z.infer<typeof CapabilityZ>;

export const ConnectorConfigFieldZ = z.object({
  key: z.string(),             // e.g. "DATABASE_URL" or "apiKey"
  label: z.string(),           // e.g. "Database URL"
  type: z.enum(["string", "number", "boolean", "password", "json"]),
  required: z.boolean().default(true),
  secret: z.boolean().default(false),
  description: z.string().optional(),
  defaultValue: z.any().optional(),
});

export type ConnectorConfigField = z.infer<typeof ConnectorConfigFieldZ>;

export const ConnectorSpecZ = z.object({
  id: z.string().min(1),           // "postgres-basic"
  displayName: z.string().min(1),  // "Postgres (Basic)"
  version: z.string().min(1),      // "0.1.0"
  capabilities: z.array(CapabilityZ).default([]),
  configSchema: z.array(ConnectorConfigFieldZ).default([]),
});

export type ConnectorSpec = z.infer<typeof ConnectorSpecZ>;

export type QueryParams = readonly unknown[];

export interface ConnectorInstance {
  /** Optionally establish a connection or validate config. */
  testConnection(): Promise<{ ok: true } | { ok: false; error: string }>;

  /** Execute a query; semantics depend on capability "sql" or "http". */
  query<T = unknown>(input: { sql?: string; params?: QueryParams; path?: string; body?: any }): Promise<T[]>;

  /** Optional bulk ingestion hook (files/FHIR/etc.) */
  ingest?(input: { source: string; options?: Record<string, any> }): Promise<{ count: number }>;

  /** Optional vector operations */
  upsertEmbedding?(opts: { table: string; id: string; vector: number[]; payload?: Record<string, any> }): Promise<void>;
  similar?(opts: { table: string; vector: number[]; topK?: number }): Promise<Array<{ id: string | number; score: number }>>;
}

export type ConnectorFactory = (config: Record<string, any>) => ConnectorInstance;

export const ToolSpecZ = z.object({
  id: z.string().min(1),            // "sql-explain"
  displayName: z.string().min(1),   // "Explain SQL"
  version: z.string().min(1),
  description: z.string().optional(),
});

export type ToolSpec = z.infer<typeof ToolSpecZ>;

export interface ToolImpl {
  run(input: Record<string, any>): Promise<any>;
}

export type ToolFactory = () => ToolImpl;

export const PluginManifestZ = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  version: z.string().min(1),
  connectors: z.array(z.object({
    spec: ConnectorSpecZ,
    create: z.function().args(z.record(z.any())).returns(z.any()),
  })).default([]),
  tools: z.array(z.object({
    spec: ToolSpecZ,
    create: z.function().args().returns(z.any()),
  })).default([]),
});

export type PluginManifest = z.infer<typeof PluginManifestZ>;
