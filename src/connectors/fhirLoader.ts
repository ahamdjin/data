import Client from 'fhir-kit-client'
import { Connector } from './base'
import fs from 'fs'
import path from 'path'
import { ensureDir } from '@/lib/fs'

export interface FhirLoaderOptions {
  resourceType: string
  query?: Record<string, string>
}

export class FhirLoader extends Connector<FhirLoaderOptions> {
  private client: Client

  constructor(options: FhirLoaderOptions) {
    super(options)
    this.client = new Client({
      baseUrl: process.env.FHIR_BASE_URL || '',
      auth: {
        username: process.env.FHIR_USERNAME || '',
        password: process.env.FHIR_PASSWORD || ''
      }
    })
  }

  async connect(): Promise<void> {
    try {
      await this.client.capabilityStatement()
    } catch (err) {
      ensureDir('logs')
      fs.appendFileSync(path.join('logs', 'fhirLoader.err'), String(err) + '\n')
      throw err
    }
  }

  async *load(): AsyncGenerator<unknown> {
    const count = Number(process.env.FHIR_PAGE_SIZE || '50')
    let bundle = await this.client.search({
      resourceType: this.options.resourceType,
      searchParams: { ...(this.options.query || {}), _count: count }
    })

    while (bundle) {
      for (const entry of bundle.entry || []) {
        yield entry.resource
      }
      const next = bundle.link?.find(l => l.relation === 'next')?.url
      if (!next) break
      bundle = await this.client.request(next)
    }
  }
}
