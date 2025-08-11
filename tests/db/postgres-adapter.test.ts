import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createPostgresAdapter } from '@/db/adapters/postgres';

const url = process.env.DATABASE_URL;

(url ? describe : describe.skip)('PostgresAdapter', () => {
  let db: ReturnType<typeof createPostgresAdapter>;

  beforeAll(() => {
    db = createPostgresAdapter(url!);
  });

  afterAll(async () => {
    await db.close?.();
  });

  it('runs a simple select', async () => {
    const rows = await db.query<{ one: number }>('SELECT 1 as one');
    expect(rows[0].one).toBe(1);
  });
});
