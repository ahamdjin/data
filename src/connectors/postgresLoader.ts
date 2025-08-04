import { getDb } from '@/providers/db'
import type { Sql } from 'postgres'
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

  private get sql(): Sql {
    return getDb(this.database)
  }

  async ingest(): Promise<any[]> {
    return this.sql.unsafe(this.query)
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
    const db = this.sql
    return db`SELECT * FROM ${db(this.table)} ORDER BY embedding <-> ${e} LIMIT ${k}`
  }

  async connected(): Promise<boolean> {
    const count = await prisma.secret.count({ where: { source: 'postgres' } })
    return count > 0
  }
}
