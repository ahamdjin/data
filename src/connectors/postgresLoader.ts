import { getAdapter } from '@/db/registry'
import type { DbAdapter } from '@/db/Adapter'
import { uuid } from '@/lib/utils'
import { Connector, Document } from './base'
import { embedChunks } from '@/lib/embedChunks'
import { prisma } from '@/providers/prisma'

/**
 * Loads documents from a Postgres query.
 */
export class PostgresLoader extends Connector {
  constructor(
    private query = 'SELECT 1',
    private table = 'Embeddings',
    private database = 'default'
  ) {
    super()
  }

  private get db(): DbAdapter {
    return getAdapter(this.database)
  }

  async ingest(): Promise<any[]> {
    return this.db.query(this.query)
  }

  async chunk(rows: any[]): Promise<Document[]> {
    return rows.map((r) => ({ id: String(r.id ?? uuid()), text: JSON.stringify(r) }))
  }

  async embed(chunks: Document[]): Promise<number[][]> {
    return embedChunks(chunks.map((c) => c.text))
  }

  async upsert(): Promise<void> {
    // Ingested rows are not stored for Postgres connector
    return
  }

  async similar(question: string, k: number): Promise<any[]> {
    const [e] = await embedChunks([question])
    return this.db.query(
      `SELECT * FROM ${this.table} ORDER BY embedding <-> $1 LIMIT $2`,
      [e, k]
    )
  }

  async connected(): Promise<boolean> {
    const count = await prisma.secret.count({ where: { source: 'postgres' } })
    return count > 0
  }
}
