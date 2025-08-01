import { describe, it, expect, vi } from 'vitest'
import { embedChunks } from '../src/lib/embedChunks'

describe('embedChunks', () => {
  it('returns embeddings', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: [0, 1] }] })
    }) as any
    process.env.OPENAI_API_KEY = 'test'
    const out = await embedChunks(['a'])
    expect(out).toEqual([[0, 1]])
  })
})
