import { NextRequest, NextResponse } from "next/server";
import { resolveTenantFromRequest } from "@/lib/tenant";
import { withTenant } from "@/db/withTenant";
import { queue } from "@/queue/queue";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const tx = resolveTenantFromRequest(req);
  if (!tx?.orgId) return NextResponse.json({ ok: false, error: "Missing tenant (x-org-id)" }, { status: 400 });

  const datasetId = params.id;
  const exists = await withTenant(tx.orgId, async (db) => {
    const rows = await db.query(`SELECT 1 FROM datasets WHERE id = $1`, [datasetId]);
    return rows.length > 0;
  });
  if (!exists) return NextResponse.json({ ok: false, error: "Dataset not found" }, { status: 404 });

  const job = await queue.add("dataset.embed", {
    type: "dataset.embed",
    orgId: tx.orgId,
    datasetId,
    batchSize: 64,
  });

  return NextResponse.json({ ok: true, id: job.id });
}
