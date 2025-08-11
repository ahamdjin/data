import { describe, it, expect } from 'vitest';
import { getAdapter } from '@/db/registry';

async function withOrg(orgId: string, fn: (query: (sql: string, params?: any[]) => Promise<any[]>) => Promise<void>) {
  const db = getAdapter('default');
  await db.query('BEGIN');
  try {
    await db.query("SELECT set_config('app.current_org_id', $1, true)", [orgId]);
    await fn((sql, params = []) => db.query(sql, params));
    await db.query('COMMIT');
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  }
}

const url = process.env.DATABASE_URL;

(url ? describe : describe.skip)('RLS isolation', () => {
  it('prevents cross-org reads', async () => {
    const db = getAdapter('default');
    const [o1] = await db.query<{ id: string }>('INSERT INTO organizations (name) VALUES ($1) RETURNING id', ['Org A']);
    const [o2] = await db.query<{ id: string }>('INSERT INTO organizations (name) VALUES ($1) RETURNING id', ['Org B']);

    await withOrg(o1.id, async (q) => {
      await q('INSERT INTO datasets (organization_id, name) VALUES ($1, $2)', [o1.id, 'A-only']);
    });
    await withOrg(o2.id, async (q) => {
      await q('INSERT INTO datasets (organization_id, name) VALUES ($1, $2)', [o2.id, 'B-only']);
    });

    await withOrg(o1.id, async (q) => {
      const rows = await q('SELECT name FROM datasets ORDER BY name');
      expect(rows.map((r: any) => r.name)).toEqual(['A-only']);
    });

    await withOrg(o2.id, async (q) => {
      const rows = await q('SELECT name FROM datasets ORDER BY name');
      expect(rows.map((r: any) => r.name)).toEqual(['B-only']);
    });
  });
});
