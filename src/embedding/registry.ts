import type { Embedder } from "./Embedder";
import { createOpenAIEmbedder } from "./vendors/openai";

let embedder: Embedder | null = null;

export function getEmbedder(): Embedder {
  if (embedder) return embedder;
  embedder = createOpenAIEmbedder({ model: "text-embedding-3-small" });
  return embedder;
}
