import { chunkText } from "@/ingest/chunker";

export function rowsToChunks(rows: Record<string, any>[], opts?: { rowsPerChunk?: number }): { ordinal: number; content: string; meta?: any }[] {
  const batch = opts?.rowsPerChunk ?? 100; // 100 rows per chunk
  const out: any[] = [];
  for (let i = 0; i < rows.length; i += batch) {
    const slice = rows.slice(i, i + batch);
    const text = slice.map(r => JSON.stringify(r)).join("\n");
    // Use chunkText in case this exceeds limits (nested chunks)
    const sub = chunkText(text, { maxTokens: 4000, overlap: 100 });
    for (const s of sub) out.push(s);
  }
  // ensure ordinal fields are sequential
  return out.map((c, idx) => ({ ...c, ordinal: idx }));
}
