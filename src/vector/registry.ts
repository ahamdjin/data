import type { VectorStore } from "./VectorStore";
import { createPgvectorStore } from "./adapters/pgvector";
// import { createQdrantStore } from "./adapters/qdrant";
import { env } from "@/config/env";

let store: VectorStore | null = null;

export function getVectorStore(): VectorStore {
  if (store) return store;
  const dim = 1536;
  store = createPgvectorStore(dim);
  // if (env.server.QDRANT_URL) {
  //   store = createQdrantStore(dim, env.server.QDRANT_URL, env.server.QDRANT_API_KEY);
  // }
  return store;
}
