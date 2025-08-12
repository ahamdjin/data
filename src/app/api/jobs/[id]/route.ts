import { NextRequest, NextResponse } from "next/server";
import { resolveTenantFromRequest } from "@/lib/tenant";
import { withTenant } from "@/db/withTenant";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const tx = resolveTenantFromRequest(req);
  if (!tx?.orgId) return NextResponse.json({ ok: false, error: "Missing tenant (x-org-id)" }, { status: 400 });

  const id = params.id;

  const out = await withTenant(tx.orgId, async (db) => {
    const rows = await db.query(
      "SELECT id, type, status, progress, error, result, created_at, updated_at FROM jobs WHERE id = $1",
      [id]
    );
    return rows[0];
  });

  if (!out) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, job: out });
}
