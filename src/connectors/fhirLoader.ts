import FhirKitClient from 'fhir-kit-client'
import { Connector, Document } from './base'
import { flattenBundle, chunkJSON } from '@/lib/chunking/fhirChunker'
import pLimit from 'p-limit'
import { embedChunks } from '@/lib/embedChunks'
import { prisma } from '@/providers/prisma'

/** Connector that pulls resources from a FHIR server. */
export class FhirLoader extends Connector {
  private pageSize = Number(process.env.FHIR_PAGE_SIZE ?? '50')
  private client: FhirKitClient | null = null

  private getClient(): FhirKitClient {
    if (!this.client) {
      const baseUrl = process.env.FHIR_BASE_URL
      if (!baseUrl) {
        throw new Error('Missing FHIR_BASE_URL environment variable')
      }
      this.client = new FhirKitClient({
        baseUrl,
        auth: {
          username: process.env.FHIR_USERNAME ?? '',
          password: process.env.FHIR_PASSWORD ?? ''
        }
      } as any)
    }
    return this.client
  }

  async ingest(opts: { since?: string; max?: number } = {}): Promise<any[]> {
    let url = `${this.resourceType}?_count=${this.pageSize}`
    if (opts.since) url += `&_lastUpdated=gt${opts.since}`
    const out: any[] = []
    const seen = new Set<string>()
    const limit = pLimit(5)
    while (url && (!opts.max || out.length < opts.max)) {
      const bundle = await limit(() => this.getClient().issueGetRequest(url))
      const resources = flattenBundle(bundle).filter((r: any) => {
        if (!r.id) return true
        if (seen.has(r.id)) return false
        seen.add(r.id)
        return true
      })
      out.push(...resources)
      url = (bundle as any).link?.find((l: any) => l.relation === 'next')?.url
    }
    return out.slice(0, opts.max ?? out.length)
  }

  constructor(private resourceType: string = 'Patient') { super() }

  async chunk(resources: any[]): Promise<Document[]> {
    return resources.flatMap((r: any) => chunkJSON(r))
  }

  async embed(chunks: Document[]): Promise<number[][]> {
    return embedChunks(chunks.map((c) => c.text))
  }

  async upsert(chunks: Document[], embeds: number[][]): Promise<void> {
    await prisma.$transaction(
      chunks.map((c, i) =>
        prisma.fhirResource.create({
          data: {
            resourceType: this.resourceType,
            rawJson: JSON.parse(c.text),
            chunkText: c.text,
            embedding: embeds[i],
            patientId: undefined,
            encounterId: undefined
          }
        })
      )
    )
  }

  async similar(question: string, k: number): Promise<any[]> {
    const [e] = await embedChunks([question])
    const rows = await prisma.$queryRaw<any[]>`
      SELECT id, "chunkText", embedding <-> ${e} AS score FROM "FhirResource" ORDER BY score ASC LIMIT ${k}
    `
    return rows.map((r) => ({ row: { id: r.id, text: r.chunkText, embedding: r.embedding }, score: Number(r.score), source: 'fhir' }))
  }

  async connected(): Promise<boolean> {
    const count = await prisma.secret.count({ where: { source: 'fhir' } })
    return count > 0
  }
}
