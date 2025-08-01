import { describe, it, expect } from 'vitest';
import { fhirChunker } from '../src/lib/chunking/fhirChunker';
import { Document } from '../src/connectors/base';

describe('fhirChunker', () => {
  it('splits text into chunks', () => {
    const docs: Document[] = [{ id: '1', text: 'a'.repeat(25) }];
    const chunks = fhirChunker(docs, 10);
    expect(chunks.length).toBe(3);
    expect(chunks[0].text).toBe('aaaaaaaaaa');
  });
});
