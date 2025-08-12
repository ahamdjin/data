import { z } from "zod";

/**
 * Define server-only environment variables here.
 * DO NOT expose secrets in the public schema below.
 */
const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Primary DB for the app (optional for builds without a DB)
  DATABASE_URL: z.string().url().optional().describe("Primary database URL (e.g., Postgres)"),
  // Optional extra DBs (A1 auto-loaded via DATABASE_URL_<NAME>), so no need to list here.
  // LLM keys (make optional if you support multiple providers)
  OPENAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  // Misc runtime knobs
  PORT: z.coerce.number().default(3000),
  // Queue backend; optional for builds that don't need background jobs
  REDIS_URL: z.string().url().optional().describe("Redis connection URL for BullMQ"),
  QUEUE_CONCURRENCY: z.coerce.number().default(5),
  // Feature flags (as strings -> booleans later)
  ENABLE_CONNECTOR_HTTP: z.string().optional(), // "true"/"false"
  OTEL_SERVICE_NAME: z.string().default("datai"),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(), // e.g., http://localhost:4318
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  ENABLE_OBSERVABILITY: z.string().optional(), // "true" to enable SDK
});

/**
 * Public (client-visible) env. Keep this minimal.
 */
const PublicEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("DATAI"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

function load<T extends z.ZodTypeAny>(schema: T, source: Record<string, unknown>, label: string) {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    // Pretty-print errors
    const issues = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("\n- ");
    throw new Error(`Invalid ${label} environment:\n- ${issues}`);
  }
  return parsed.data as z.infer<T>;
}

const rawServer = {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  PORT: process.env.PORT,
  REDIS_URL: process.env.REDIS_URL,
  QUEUE_CONCURRENCY: process.env.QUEUE_CONCURRENCY,
  ENABLE_CONNECTOR_HTTP: process.env.ENABLE_CONNECTOR_HTTP,
  OTEL_SERVICE_NAME: process.env.OTEL_SERVICE_NAME,
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  LOG_LEVEL: process.env.LOG_LEVEL,
  ENABLE_OBSERVABILITY: process.env.ENABLE_OBSERVABILITY,
};

const rawPublic = {
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
};

const server = load(ServerEnvSchema, rawServer, "server");
const _public = load(PublicEnvSchema, rawPublic, "public");

// Normalize feature flags
const flags = {
  ENABLE_CONNECTOR_HTTP: server.ENABLE_CONNECTOR_HTTP === "true",
  ENABLE_OBSERVABILITY: server.ENABLE_OBSERVABILITY === "true",
};

export const env = {
  server,
  public: _public,
  flags,
} as const;
