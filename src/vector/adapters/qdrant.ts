import type { VectorStore } from "../VectorStore";
import { QdrantClient } from "qdrant-client";

export function createQdrantStore(dim: number, url: string, apiKey?: string): VectorStore {
  const client = new QdrantClient({ url, apiKey });

  async function ensureCollection(name: string) {
    const existing = await client.getCollections();
    const exists = existing.collections?.some(c => c.name === name);
    if (!exists) {
      await client.createCollection(name, { vectors: { size: dim, distance: "Cosine" } });
    }
  }

  return {
    name: "qdrant",
    dim,

    async upsert({ namespace, vectors }) {
      await ensureCollection(namespace);
      await client.upsert(namespace, {
        points: vectors.map(v => ({
          id: v.id,
          vector: v.vector,
          payload: v.payload ?? {},
        })),
      });
    },

    async query({ namespace, vector, topK = 5, filter }) {
      await ensureCollection(namespace);
      const res = await client.search(namespace, {
        vector,
        limit: topK,
        filter: filter
          ? {
              must: Object.entries(filter).map(([k, val]) => ({ key: k, match: { value: val } })),
            }
          : undefined,
      });
      return res.map(r => ({ id: String(r.id), score: r.score ?? 0, payload: r.payload ?? {} }));
    },
  };
}
