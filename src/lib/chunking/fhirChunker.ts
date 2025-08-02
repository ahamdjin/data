import { Document } from '@/connectors/base'
import { encoding_for_model } from '@dqbd/tiktoken'

export interface Chunk { id: string; text: string }

/** Flatten a FHIR bundle into an array of resources. */
export function flattenBundle(bundle: any): any[] {
  return (bundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean)
}

const enc = encoding_for_model('text-embedding-3-large')

/**
 * Chunk a JSON object ensuring each piece stays under `maxTokens` tokens.
 */
export function chunkJSON(json: any, maxTokens = 500): Chunk[] {
  const text = typeof json === 'string' ? json : JSON.stringify(json)
  const id = (json && (json.id || json.resourceType)) || 'unknown'
  const tokens = enc.encode(text)
  const out: Chunk[] = []
  for (let i = 0; i < tokens.length; i += maxTokens) {
    const slice = tokens.slice(i, i + maxTokens)
    const decoded = enc.decode(slice)
    const textChunk = typeof decoded === 'string' ? decoded : new TextDecoder().decode(decoded)
    out.push({ id, text: textChunk })
  }
  return out
}
