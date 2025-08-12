import { NextRequest, NextResponse } from "next/server";
import { resolveTenantFromRequest } from "@/lib/tenant";
import { withTenant } from "@/db/withTenant";
import { withObservability } from "@/lib/handlers/withObs";

export const GET = withObservability(async (req: NextRequest) => {
  const tx = resolveTenantFromRequest(req);
  if (!tx?.orgId) return NextResponse.json({ ok: false, error: "Missing tenant (x-org-id)" }, { status: 400 });

  const items = await withTenant(tx.orgId, async (db) => {
    const llm = await db.query(
      `SELECT 'llm' as kind, at, model, operation, input_tokens, output_tokens, latency_ms, meta
       FROM audit_llm_calls ORDER BY at DESC LIMIT 20`
    );
    const search = await db.query(
      `SELECT 'search' as kind, at, query, top_k, latency_ms, meta
       FROM audit_search_queries ORDER BY at DESC LIMIT 20`
    );
    return [...llm, ...search].sort((a: any, b: any) => new Date(b.at).getTime() - new Date(a.at).getTime());
  });

  return NextResponse.json({ ok: true, items });
});
