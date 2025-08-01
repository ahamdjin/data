export interface Document {
  id: string
  text: string
  metadata?: Record<string, unknown>
}

/** Base class for all data connectors. */
export abstract class Connector {
  /** Retrieve raw data from the source. */
  abstract ingest(opts?: any): Promise<any[]>
  /** Split records into text chunks. */
  abstract chunk(data: any[]): Promise<Document[]>
  /** Generate embeddings for documents. */
  abstract embed(chunks: Document[]): Promise<number[][]>
  /** Persist chunks and embeddings. */
  abstract upsert(chunks: Document[], embeddings: number[][]): Promise<void>
  /** Retrieve similar documents for a question. */
  abstract similar(question: string, k: number): Promise<any[]>
  /** Return true if credentials are configured. */
  abstract connected(): Promise<boolean>
}
