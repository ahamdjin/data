import { describe, it, expect, vi } from 'vitest'
vi.mock('../src/providers/prisma', () => ({
  prisma: { $queryRawUnsafe: vi.fn(async () => [{ id: 1, score: 0.1 }]) }
}))
vi.mock('../src/lib/embedChunks', () => ({ embedChunks: async () => [[0,1]] }))
import { prisma } from '../src/providers/prisma'
import { similar } from '../src/retrievers/fhir'

it('top1 search', async () => {
  prisma.$queryRawUnsafe = async () => [{ id: 1, score: 0.1 }]
  const res = await similar('hi', 1)
  expect(res[0].id).toBe(1)
})
