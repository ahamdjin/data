import { NextResponse } from "next/server";
import { loadPlugins, getConnector } from "@/plugins/registry";
import { withObservability } from "@/lib/handlers/withObs";

export const POST = withObservability(async (req) => {
  await loadPlugins();
  const body = await req.json();
  const { create } = getConnector("firestore");
  const conn = create({});
  const rows = await conn.query({ firestore: body.firestore });
  return NextResponse.json({ ok: true, rows });
});
