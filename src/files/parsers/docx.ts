import mammoth from "mammoth";
import { chunkText } from "@/ingest/chunker";

export async function parseDocxToChunks(buf: Buffer, opts?: { maxTokens?: number; overlap?: number }) {
  const { value: text } = await mammoth.extractRawText({ buffer: buf });
  const clean = (text ?? "").trim();
  if (!clean) return [];
  return chunkText(clean, { maxTokens: opts?.maxTokens ?? 4000, overlap: opts?.overlap ?? 200 });
}
