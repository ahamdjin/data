import { NextRequest, NextResponse } from 'next/server';
import { resolveTenantFromRequest } from '@/lib/tenant';

export function requireTenant<T extends (req: NextRequest, ctx: { orgId: string }) => Promise<NextResponse>>(handler: T) {
  return async (req: NextRequest) => {
    const tx = resolveTenantFromRequest(req);
    if (!tx?.orgId) {
      return NextResponse.json({ ok: false, error: 'Missing tenant (x-org-id)' }, { status: 400 });
    }
    return handler(req, { orgId: tx.orgId });
  };
}
