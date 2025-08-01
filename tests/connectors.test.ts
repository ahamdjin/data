import { describe, it, expect, vi } from 'vitest'

vi.mock('fhir-kit-client', () => {
  return { default: class { constructor(public opts:any){} capabilityStatement=vi.fn().mockResolvedValue({}); search=vi.fn().mockResolvedValue({}); request=vi.fn()} }
})

import { FhirLoader } from '../src/connectors/fhirLoader'

describe('FhirLoader', () => {
  it('uses env vars for base url', async () => {
    process.env.FHIR_BASE_URL = 'http://example.com'
    const loader = new FhirLoader({ resourceType: 'Patient' })
    await loader.connect()
    expect((loader as any).client.opts.baseUrl).toBe('http://example.com')
  })
})
