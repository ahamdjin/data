import { NextRequest, NextResponse } from "next/server";
import { resolveTenantFromRequest } from "@/lib/tenant";
import { withTenant } from "@/db/withTenant";
import { ConnectorIngestZ } from "@/queue/jobs";
import { queue } from "@/queue/queue";
import crypto from "node:crypto";

export async function POST(req: NextRequest) {
  const tx = resolveTenantFromRequest(req);
  if (!tx?.orgId) return NextResponse.json({ ok: false, error: "Missing tenant (x-org-id)" }, { status: 400 });

  const { connectorId, config, source, options, idempotencyKey } = await req.json();

  const payload = ConnectorIngestZ.parse({
    type: "connector.ingest",
    orgId: tx.orgId,
    connectorId,
    config,
    source,
    options,
    idempotencyKey,
  });

  let dedupeKey = idempotencyKey ?? crypto.createHash("sha1").update(JSON.stringify(payload)).digest("hex");

  const [audit] = await withTenant(tx.orgId, async (db) => {
    return db.query<{ id: string }>(
      `INSERT INTO jobs (organization_id, type, status, progress, payload, idempotency_key)
       VALUES ($1, $2, 'queued', 0, $3::jsonb, $4)
       ON CONFLICT (idempotency_key) WHERE $4 IS NOT NULL DO UPDATE SET updated_at = now()
       RETURNING id`,
      [tx.orgId, payload.type, JSON.stringify(payload), idempotencyKey ?? null]
    );
  });

  const jobId = audit.id;

  await queue.add(payload.type, payload, { jobId });

  return NextResponse.json({ ok: true, id: jobId });
}
