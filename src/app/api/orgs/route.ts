import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/db/registry';

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name) return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 });

  const db = getAdapter('default');
  const rows = await db.query<{ id: string }>(
    'INSERT INTO organizations (name) VALUES ($1) RETURNING id',
    [name]
  );
  return NextResponse.json({ ok: true, id: rows[0].id });
}
