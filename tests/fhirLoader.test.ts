import { describe, it, expect, vi } from 'vitest'

const { createMock, transactionMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  transactionMock: vi.fn(async (ops: any[]) => {
    for (const op of ops) {
      await op
    }
  })
}))

vi.mock('../src/providers/prisma', () => ({
  prisma: {
    fhirResource: { create: createMock },
    $transaction: transactionMock
  }
}))

import { FhirLoader } from '../src/connectors/fhirLoader'

describe('FhirLoader', () => {
  it('chunks resources with original data and upserts valid chunks', async () => {
    const loader = new FhirLoader('Patient')
    const resource = { resourceType: 'Patient', id: '1', name: 'John' }
    const chunks = await loader.chunk([resource])
    expect(chunks[0].metadata?.resource).toEqual(resource)

    const invalidChunk: any = { id: 'bad', text: 'oops' }
    const embeds = [[0], [1]]
    await loader.upsert([...chunks, invalidChunk], embeds)

    expect(createMock).toHaveBeenCalledTimes(1)
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ rawJson: resource, chunkText: chunks[0].text })
      })
    )
    expect(transactionMock).toHaveBeenCalledTimes(1)
  })
})
