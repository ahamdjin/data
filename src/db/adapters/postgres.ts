// src/db/adapters/postgres.ts
import postgres from 'postgres';
import type { DbAdapter, QueryParams } from '../Adapter';

export function createPostgresAdapter(url: string): DbAdapter {
  const sql = postgres(url, { max: 10 }); // connection pool

  return {
    name: 'postgres',
    capabilities: ['sql', 'vector', 'json', 'fulltext'],

    async query<T = unknown>(q: string, params: QueryParams = []) {
      // postgres.js supports unsafe w/ params
      const rows = await sql.unsafe(q, params);
      return rows as unknown as T[];
    },

    table<T = unknown>(name: string) {
      return {
        all: async () => (await sql`SELECT * FROM ${sql(name)}`) as unknown as T[],
        byId: async (id: string | number) => {
          const rows = await sql`SELECT * FROM ${sql(name)} WHERE id = ${id}`;
          return (rows[0] as unknown as T) ?? undefined;
        },
      };
    },

    async upsertEmbedding({ table, id, vector, payload }) {
      // Requires pgvector + columns: id, embedding, payload (jsonb)
      await sql.unsafe(
        `INSERT INTO ${table} (id, embedding, payload)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE
           SET embedding = EXCLUDED.embedding,
               payload   = EXCLUDED.payload`,
        [id, vector, payload ?? {}],
      );
    },

    async similar({ table, vector, topK = 5 }) {
      // Cosine distance with pgvector’s <=> operator; adjust if you use L2
      const rows = await sql.unsafe(
        `SELECT id, 1 - (embedding <=> $1) AS score
           FROM ${table}
          ORDER BY embedding <=> $1
          LIMIT $2`,
        [vector, topK],
      );
      return rows as Array<{ id: string | number; score: number }>;
    },

    async close() {
      await sql.end({ timeout: 5 });
    },
  };
}
