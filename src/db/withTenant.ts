import { getAdapter } from './registry';

export async function withTenant<T>(orgId: string, fn: (db: ReturnType<typeof getAdapter>) => Promise<T>) {
  const db = getAdapter('default');

  if ((db as any).name === 'postgres') {
    await db.query('BEGIN');
    try {
      await db.query("SELECT set_config('app.current_org_id', $1, true)", [orgId]);
      const out = await fn(db);
      await db.query('COMMIT');
      return out;
    } catch (e) {
      await db.query('ROLLBACK');
      throw e;
    }
  }

  return fn(db);
}
