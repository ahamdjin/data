import { sql } from '@/providers/db';
import { generateUUID } from '@/lib/utils';
import { Connector, Document } from './base';
import { embedChunks } from '@/lib/embedChunks';
import { prisma } from '@/providers/prisma';
import format from 'pg-format'

/**
 * Loads documents from a Postgres query.
 */
export class PostgresLoader extends Connector {
  constructor(private query = 'SELECT 1') { super() }

  async ingest(): Promise<any[]> {
    const safe = format('%s', this.query)
    return sql(safe)
  }

  async chunk(rows: any[]): Promise<Document[]> {
    return rows.map((r) => ({ id: String(r.id ?? generateUUID()), text: JSON.stringify(r) }))
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
    const rows = await sql`SELECT *, embedding <-> ${sql.array(e)} as score FROM "FhirResource" ORDER BY score LIMIT ${k}`
    return rows.map((r: any) => ({ row: r, score: Number(r.score), source: 'postgres' }))
  }

  async connected(): Promise<boolean> {
    const count = await prisma.secret.count({ where: { source: 'postgres' } })
    return count > 0
  }
}
