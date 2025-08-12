import { getAdapter } from "@/db/registry";
import crypto from "node:crypto";

export async function auditLlmCall(opts: {
  orgId: string;
  model: string;
  operation: "embed" | "chat" | "completion";
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  prompt?: string;
  meta?: Record<string, any>;
}) {
  const db = getAdapter("default");
  const promptHash = opts.prompt ? crypto.createHash("sha1").update(opts.prompt).digest("hex") : null;
  await db.query(
    `INSERT INTO audit_llm_calls (organization_id, model, operation, input_tokens, output_tokens, latency_ms, prompt_hash, meta)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      opts.orgId,
      opts.model,
      opts.operation,
      opts.inputTokens ?? null,
      opts.outputTokens ?? null,
      opts.latencyMs ?? null,
      promptHash,
      opts.meta ?? null,
    ]
  );
}

export async function auditSearchQuery(opts: {
  orgId: string;
  datasetId?: string;
  query: string;
  topK?: number;
  latencyMs?: number;
  meta?: Record<string, any>;
}) {
  const db = getAdapter("default");
  await db.query(
    `INSERT INTO audit_search_queries (organization_id, dataset_id, query, top_k, latency_ms, meta)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      opts.orgId,
      opts.datasetId ?? null,
      opts.query,
      opts.topK ?? null,
      opts.latencyMs ?? null,
      opts.meta ?? null,
    ]
  );
}
