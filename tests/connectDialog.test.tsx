import { describe, it, expect } from 'vitest'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
process.env.FHIR_BASE_URL = 'http://example.com'
describe('ConnectDialog', () => {
  it('renders connector list', async () => {
    process.env.FHIR_BASE_URL = 'http://example.com'
    const mod = await import('../src/components/chat/ConnectDialog')
    const html = ReactDOMServer.renderToString(<mod.AddDatabaseDialog />)
    expect(html).toContain('Connect')
  })
})
