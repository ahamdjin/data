import { describe, it, expect } from 'vitest'
import { chunkFhirResource } from '../src/lib/chunking/fhirChunker'

describe('chunkFhirResource', () => {
  it('splits resource into chunks', () => {
    const res = { id: '1', data: 'a'.repeat(2100) }
    const chunks = chunkFhirResource(res, 1000)
    expect(chunks.length).toBe(3)
    expect(chunks[0].text.length).toBe(1000)
  })
})
