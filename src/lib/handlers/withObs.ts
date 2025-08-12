import { NextRequest, NextResponse } from "next/server";
import { newRequestId, getTraceIds } from "@/observability/correlation";
import { childLogger } from "@/observability/logger";
import { resolveTenantFromRequest } from "@/lib/tenant";

export function withObservability<T extends (req: NextRequest, log: ReturnType<typeof childLogger>) => Promise<NextResponse>>(handler: T) {
  return async (req: NextRequest) => {
    const reqId = newRequestId();
    const tx = resolveTenantFromRequest(req) || undefined;
    const base = { requestId: reqId, orgId: tx?.orgId };
    const log = childLogger(base);
    try {
      log.info({ path: req.nextUrl.pathname, method: req.method, ...getTraceIds() }, "HTTP start");
      const res = await handler(req, log);
      log.info({ status: res.status, ...getTraceIds() }, "HTTP done");
      return res;
    } catch (e: any) {
      log.error({ err: e?.message, stack: e?.stack, ...getTraceIds() }, "HTTP error");
      return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
    }
  };
}
