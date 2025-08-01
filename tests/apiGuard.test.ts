import { describe, it, expect, vi } from 'vitest'
import { POST } from '../src/app/api/chat/route'

vi.mock('../src/connectors/registry', () => ({
  getActiveConnectors: vi.fn(async () => ({}))
}))
vi.mock('../src/app/api/chat/tools/displayResults', () => ({ displayResults: vi.fn() }))
vi.mock('../src/app/api/chat/tools/queryDatabase', () => ({ queryDatabase: vi.fn() }))
vi.mock('../src/app/api/chat/tools/selectTable', () => ({ selectTable: vi.fn() }))
vi.mock('ai', () => ({
  streamText: vi.fn(() => ({ toDataStreamResponse: () => new Response('ok') })),
  tool: vi.fn()
}))

describe('chat api guard', () => {
  it('returns 400 when tool not connected', async () => {
    const req = new Request('http://test', { method: 'POST', body: JSON.stringify({ messages: [{ tool: 'fhir_query' }] }) })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })
})
