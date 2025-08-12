import crypto from "node:crypto";

export async function hashStreamSHA1(stream: NodeJS.ReadableStream): Promise<{ sha1: string; length: number; buffer?: Buffer }> {
  const hash = crypto.createHash("sha1");
  const chunks: Buffer[] = [];
  let len = 0;
  for await (const chunk of stream as any) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    hash.update(buf);
    chunks.push(buf);
    len += buf.length;
  }
  return { sha1: hash.digest("hex"), length: len, buffer: Buffer.concat(chunks) };
}

export function hashBufferSHA1(buf: Buffer): { sha1: string; length: number } {
  return { sha1: crypto.createHash("sha1").update(buf).digest("hex"), length: buf.length };
}
