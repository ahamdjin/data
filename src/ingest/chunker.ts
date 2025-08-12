export type Chunk = { ordinal: number; content: string; meta?: Record<string, any> };

export type ChunkOptions = {
  maxTokens?: number;
  overlap?: number;
};

const DEFAULTS: Required<ChunkOptions> = { maxTokens: 800, overlap: 100 };

export function chunkText(text: string, opts: ChunkOptions = {}): Chunk[] {
  const { maxTokens, overlap } = { ...DEFAULTS, ...opts };
  const chunks: Chunk[] = [];
  let i = 0;
  let ordinal = 0;

  while (i < text.length) {
    const end = Math.min(i + maxTokens, text.length);
    const part = text.slice(i, end);
    chunks.push({ ordinal, content: part });
    ordinal += 1;
    if (end === text.length) break;
    i = end - overlap;
    if (i < 0) i = 0;
  }

  return chunks;
}
