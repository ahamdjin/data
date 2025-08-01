import { describe, it, expect, vi } from 'vitest'
vi.mock('../src/providers/prisma', () => ({
  prisma: { $queryRawUnsafe: vi.fn(async () => [{ id: 1 }]) }
}))
vi.mock('../src/lib/embedChunks', () => ({ embedChunks: vi.fn(async () => [[0,1]]) }))
import { similar } from '../src/retrievers/fhir'

describe('similar', () => {
  it('queries with embedding', async () => {
    const res = await similar('hi', 1)
    expect(res).toEqual([{ id: 1 }])
  })
})
