import { describe, it, expect, vi } from 'vitest'

const { queryMock } = vi.hoisted(() => {
  const queryMock = vi.fn(async (sql: string) => [{ text: sql }])
  return { queryMock }
})

vi.mock('../src/db/registry', () => ({ getAdapter: () => ({ query: queryMock }) }))

vi.mock('../src/lib/embedChunks', () => ({
  embedChunks: vi.fn(async () => [[0.1, 0.2]])
}))

import { PostgresLoader } from '../src/connectors/postgresLoader'

describe('PostgresLoader', () => {
  it('queries the configured table for similarity', async () => {
    const loader = new PostgresLoader('SELECT 1', 'MyTable')
    await loader.ingest()
    const res = await loader.similar('hello', 2)
    expect(res).toEqual([
      { text: 'SELECT * FROM MyTable ORDER BY embedding <-> $1 LIMIT $2' }
    ])
    expect(queryMock).toHaveBeenCalledTimes(2)
    expect(queryMock.mock.calls[0][0]).toBe('SELECT 1')
  })
})
