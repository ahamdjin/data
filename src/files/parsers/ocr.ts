import Tesseract from "tesseract.js";
import { chunkText } from "@/ingest/chunker";

type OCROpts = { lang?: string; maxBytes?: number; maxTokens?: number; overlap?: number };

export async function parseImageToChunks(buf: Buffer, opts: OCROpts = {}) {
  const maxBytes = opts.maxBytes ?? 10 * 1024 * 1024; // 10MB guard
  if (buf.byteLength > maxBytes) throw new Error(`Image too large for OCR (${buf.byteLength} bytes)`);

  const lang = opts.lang ?? "eng";
  const res = await Tesseract.recognize(buf, lang);
  const text = (res.data?.text ?? "").trim();
  if (!text) return [];

  return chunkText(text, { maxTokens: opts.maxTokens ?? 3000, overlap: opts.overlap ?? 150 });
}
