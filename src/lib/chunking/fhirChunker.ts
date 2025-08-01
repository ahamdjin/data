import { Document } from '@/connectors/base'

export interface Chunk { id: string; text: string }

/** Flatten a FHIR bundle into an array of resources. */
export function flattenBundle(bundle: any): any[] {
  return (bundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean)
}

/**
 * Chunk a JSON object by stringifying and splitting every `size` characters.
 */
export function chunkJSON(json: any, size = 500): Chunk[] {
  const text = typeof json === 'string' ? json : JSON.stringify(json)
  const id = (json && (json.id || json.resourceType)) || 'unknown'
  const out: Chunk[] = []
  for (let i = 0; i < text.length; i += size) {
    out.push({ id, text: text.slice(i, i + size) })
  }
  return out
}
