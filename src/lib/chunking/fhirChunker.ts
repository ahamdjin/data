import { Document } from '@/connectors/base';

export interface Chunk {
  id: string;
  text: string;
}

/**
 * Split FHIR documents into text chunks of a fixed size.
 */
export function fhirChunker(docs: Document[], size = 1000): Chunk[] {
  const chunks: Chunk[] = [];
  for (const doc of docs) {
    const text = doc.text;
    for (let i = 0; i < text.length; i += size) {
      chunks.push({ id: doc.id, text: text.slice(i, i + size) });
    }
  }
  return chunks;
}
