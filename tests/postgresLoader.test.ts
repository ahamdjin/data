import { describe, it, expect, vi } from 'vitest'

const { sqlMock } = vi.hoisted(() => {
  const sqlMock = vi.fn((first: any, ...rest: any[]) => {
    if (Array.isArray(first)) {
      const strings = first as TemplateStringsArray
      const values = rest
      let text = strings[0]
      let paramIndex = 1
      for (let i = 0; i < values.length; i++) {
        const v = values[i]
        if (typeof v === 'string') {
          text += v
        } else {
          text += `$${paramIndex++}`
        }
        text += strings[i + 1]
      }
      return Promise.resolve([{ text }])
    }
    return first
  })
  sqlMock.unsafe = vi.fn()
  return { sqlMock }
})

vi.mock('../src/providers/db', () => ({ getDb: () => sqlMock }))

vi.mock('../src/lib/embedChunks', () => ({
  embedChunks: vi.fn(async () => [[0.1, 0.2]])
}))

import { PostgresLoader } from '../src/connectors/postgresLoader'

describe('PostgresLoader', () => {
  it('queries the configured table for similarity', async () => {
    const loader = new PostgresLoader('SELECT 1', 'MyTable')
    const res = await loader.similar('hello', 2)
    expect(res).toEqual([
      { text: 'SELECT * FROM MyTable ORDER BY embedding <-> $1 LIMIT $2' }
    ])
    expect(sqlMock).toHaveBeenCalledTimes(2)
    expect(sqlMock.mock.calls[0][0]).toBe('MyTable')
  })
})
