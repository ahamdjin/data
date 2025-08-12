import { NextRequest, NextResponse } from "next/server";
import { resolveTenantFromRequest } from "@/lib/tenant";
import { queue } from "@/queue/queue";
import { FhirIngestZ } from "@/queue/jobs";

export async function POST(req: NextRequest) {
  const tx = resolveTenantFromRequest(req);
  if (!tx?.orgId) return NextResponse.json({ ok:false, error:"Missing tenant (x-org-id)" }, { status:400 });

  const body = await req.json();
  const parsed = FhirIngestZ.safeParse({ ...body, type: "fhir.ingest", orgId: tx.orgId });
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.message }, { status:400 });

  const job = await queue.add("fhir.ingest", parsed.data);
  return NextResponse.json({ ok:true, id: job.id });
}
