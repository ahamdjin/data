import type { VectorStore, Vector } from "../VectorStore";
import { getAdapter } from "@/db/registry";
import { withSpan } from "@/observability/spans";

/**
 * We store vectors directly in document_chunks.embedding.
 * namespace = `${orgId}:${datasetId}` is implicit via RLS + WHERE dataset_id.
 */
export function createPgvectorStore(dim: number): VectorStore {
  return {
    name: "pgvector",
    dim,

    async upsert({ namespace, vectors }) {
      const [orgId, datasetId] = namespace.split(":");
      const db = getAdapter("default");

      const sql = `
        UPDATE document_chunks
           SET embedding = $2::vector
         WHERE id = $1::uuid AND dataset_id = $3::uuid
      `;

      return withSpan("vector.upsert", { store: "pgvector", count: vectors.length }, async () => {
        for (const v of vectors) {
          await db.query(sql, [v.id, v.vector, datasetId]);
        }
      });
    },

    async query({ namespace, vector, topK = 5 }) {
      const [orgId, datasetId] = namespace.split(":");
      const db = getAdapter("default");
      return withSpan("vector.query", { store: "pgvector", topK }, async () => {
        const rows = await db.query<{ id: string; score: number }>(
          `SELECT id, 1 - (embedding <=> $1) AS score
             FROM document_chunks
            WHERE dataset_id = $2 AND embedding IS NOT NULL
            ORDER BY embedding <=> $1
            LIMIT $3`,
          [vector, datasetId, topK]
        );
        return rows.map(r => ({ id: r.id, score: r.score }));
      });
    },
  };
}
