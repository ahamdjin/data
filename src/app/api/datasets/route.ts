import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/handlers/withTenant';
import { withTenant } from '@/db/withTenant';

export const GET = requireTenant(async (_req: NextRequest, { orgId }) => {
  return withTenant(orgId, async (db) => {
    const rows = await db.query('SELECT id, name, meta FROM datasets ORDER BY name');
    return NextResponse.json({ ok: true, rows });
  });
});

export const POST = requireTenant(async (req: NextRequest, { orgId }) => {
  const { name, meta } = await req.json();
  return withTenant(orgId, async (db) => {
    await db.query(
      'INSERT INTO datasets (organization_id, name, meta) VALUES ($1, $2, $3)',
      [orgId, name ?? 'Untitled', meta ?? null]
    );
    return NextResponse.json({ ok: true });
  });
});
