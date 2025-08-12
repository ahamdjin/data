import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse/lib/pdf-parse.js");
import { chunkText } from "@/ingest/chunker";

export async function parsePdfToChunks(buf: Buffer, opts?: { maxTokens?: number; overlap?: number }) {
  const data = await pdf(buf);
  const text = (data.text ?? "").trim();
  if (!text) return [];
  const chunks = chunkText(text, { maxTokens: opts?.maxTokens ?? 4000, overlap: opts?.overlap ?? 200 });
  return chunks;
}
