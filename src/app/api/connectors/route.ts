import { NextResponse } from "next/server";
import { loadPlugins, listConnectors } from "@/plugins/registry";
import { withObservability } from "@/lib/handlers/withObs";
import { withSpan } from "@/observability/spans";

export const GET = withObservability(async (_req, log) => {
  const out = await withSpan("plugins.list", {}, async () => {
    await loadPlugins();
    return listConnectors();
  });
  log.info({ count: out.length }, "connectors listed");
  return NextResponse.json({ connectors: out });
});
