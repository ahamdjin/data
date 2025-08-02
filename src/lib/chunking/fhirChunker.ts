import { Document } from '@/connectors/base'
import { chunkJSON } from '../chunker'

export interface Chunk { id: string; text: string }

export function flattenBundle(bundle: any): any[] {
  return (bundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean)
}

export { chunkJSON }
