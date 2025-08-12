import { ParquetReader } from "parquetjs-lite";
import { Readable } from "node:stream";

export async function* parseParquet(buffer: Buffer, opts?: { limitRows?: number }) {
  const reader = await ParquetReader.openBuffer(buffer);
  try {
    const cursor = reader.getCursor(); // all columns
    const limit = opts?.limitRows ?? Infinity;
    let seen = 0;
    let record;
    while ((record = await cursor.next())) {
      yield record as Record<string, any>;
      seen += 1;
      if (seen >= limit) break;
    }
  } finally {
    await reader.close();
  }
}

// Helper to accumulate small streams to buffer. (For very large blobs, add temp file path flow.)
export async function readStreamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
