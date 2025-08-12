import { NextResponse } from "next/server";
import { loadPlugins, getConnector } from "@/plugins/registry";
import { withObservability } from "@/lib/handlers/withObs";

export const POST = withObservability(async (req) => {
  await loadPlugins();
  const body = await req.json();
  const { create } = getConnector("mongo");
  const conn = create(body.config ?? {});
  const rows = await conn.query({ mongo: body.mongo });
  return NextResponse.json({ ok: true, rows });
});
