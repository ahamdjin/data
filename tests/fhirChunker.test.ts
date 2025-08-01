import { describe, it, expect } from 'vitest';
import { chunkJSON } from '../src/lib/chunking/fhirChunker';

describe('fhirChunker', () => {
  it('splits json into chunks', () => {
    const chunks = chunkJSON({ id: '1', foo: 'a'.repeat(25) }, 10);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].text.length).toBeLessThanOrEqual(10);
  });
});
