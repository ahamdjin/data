import { describe, it, expect } from 'vitest';
import { chunkJSON } from '../src/lib/chunking/fhirChunker';
import { encodingForModel } from 'js-tiktoken';

describe('fhirChunker', () => {
  it('splits json into chunks', () => {
    const enc = encodingForModel('text-embedding-3-large');
    const chunks = chunkJSON({ id: '1', foo: 'a'.repeat(25) }, 10);
    expect(chunks.length).toBeGreaterThan(0);
    const tokenCount = enc.encode(chunks[0].text).length;
    expect(tokenCount).toBeLessThanOrEqual(10);
  });
});
