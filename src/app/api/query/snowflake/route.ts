import { NextResponse } from "next/server";
import { loadPlugins, getConnector } from "@/plugins/registry";
import { withObservability } from "@/lib/handlers/withObs";

export const POST = withObservability(async (req) => {
  await loadPlugins();
  const body = await req.json(); // { config, sql, params? }
  const { create } = getConnector("snowflake");
  const conn = create(body.config ?? {});
  const rows = await conn.query({ sql: body.sql, params: body.params ?? [] });
  return NextResponse.json({ ok: true, rows });
});
