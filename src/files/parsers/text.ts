import { chunkText } from "@/ingest/chunker";

export async function parseTextToChunks(stream: NodeJS.ReadableStream, opts?: {
  encoding?: BufferEncoding;
  maxTokens?: number;
  overlap?: number;
}) {
  const encoding = opts?.encoding ?? "utf8";
  const chunks: Buffer[] = [];
  for await (const chunk of stream as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const all = Buffer.concat(chunks).toString(encoding);
  return chunkText(all, { maxTokens: opts?.maxTokens ?? 5000, overlap: opts?.overlap ?? 200 });
}
