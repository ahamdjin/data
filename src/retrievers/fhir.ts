import { FhirLoader } from '@/connectors/fhirLoader'
import { chunkFhirResource } from '@/lib/chunking/fhirChunker'

export async function retrieveFhir(resourceType: string, query: Record<string, string> = {}) {
  const loader = new FhirLoader({ resourceType, query })
  await loader.connect()
  const chunks = [] as ReturnType<typeof chunkFhirResource>
  for await (const res of loader.load()) {
    chunks.push(...chunkFhirResource(res as Record<string, any>))
  }
  return chunks
}
