import { getDb } from "@/providers/db";

export interface DbAdapter {
  query<T = unknown>(sql: string, params?: readonly unknown[]): Promise<T[]>;
  upsertEmbedding?(opts: { table: string; id: string; vector: number[]; payload?: Record<string, any> }): Promise<void>;
  similar?(opts: { table: string; vector: number[]; topK?: number }): Promise<Array<{ id: string | number; score: number }>>;
}

export function getAdapter(name = "default"): DbAdapter {
  const db = getDb(name);
  return {
    query<T = unknown>(sql: string, params: readonly unknown[] = []) {
      return db.unsafe<T[]>(sql, params);
    },
  };
}
