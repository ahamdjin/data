export interface FhirChunk {
  id: string
  text: string
}

/** Convert a FHIR resource into text chunks. */
export function chunkFhirResource(resource: Record<string, any>, size = 1000): FhirChunk[] {
  const payload = JSON.stringify(resource)
  const chunks: FhirChunk[] = []
  for (let i = 0; i < payload.length; i += size) {
    chunks.push({ id: `${resource.id || 'unknown'}-${i / size}`, text: payload.slice(i, i + size) })
  }
  return chunks
}
