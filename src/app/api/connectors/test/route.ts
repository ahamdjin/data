import { NextRequest, NextResponse } from "next/server";
import { loadPlugins, getConnector } from "@/plugins/registry";
import { env } from "@/config/env";

/**
 * POST body:
 * {
 *   "id": "<connector-id>",            // e.g., "postgres-basic" or "custom-http"
 *   "config": { ... }                  // matches the connector's configSchema
 * }
 */
export async function POST(req: NextRequest) {
  await loadPlugins();

  const { id, config } = await req.json();

  if (!id || typeof id !== "string") {
    return NextResponse.json({ ok: false, error: "Invalid 'id'" }, { status: 400 });
  }

  try {
    const { create } = getConnector(id);

    // Example feature gate for http connector
    if (id === "custom-http" && !env.flags.ENABLE_CONNECTOR_HTTP) {
      return NextResponse.json({ ok: false, error: "Custom HTTP connector disabled by admin" }, { status: 403 });
    }

    const instance = create(config ?? {});
    const res = await instance.testConnection();
    if (res.ok) return NextResponse.json({ ok: true });
    return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
