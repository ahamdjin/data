import OpenAI from "openai";
import type { Embedder } from "../Embedder";
import { env } from "@/config/env";
import { withSpan } from "@/observability/spans";

type Opts = { model: "text-embedding-3-small" | "text-embedding-3-large" };

export function createOpenAIEmbedder(opts: Opts): Embedder {
  const client = new OpenAI({ apiKey: env.server.OPENAI_API_KEY });
  const dim = opts.model === "text-embedding-3-large" ? 3072 : 1536;

  return {
    name: `openai:${opts.model}`,
    dim,
    async embed(texts: string[]) {
      if (!texts.length) return [];
      return withSpan(
        "llm.embed",
        { vendor: "openai", model: opts.model, count: texts.length },
        async () => {
          const res = await client.embeddings.create({
            model: opts.model,
            input: texts,
          });
          return res.data.map(d => d.embedding as number[]);
        },
      );
    },
  };
}
