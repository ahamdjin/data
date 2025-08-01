import postgres from 'postgres'
import { Connector } from './base'

export interface PostgresLoaderOptions {
  query: string
}

export class PostgresLoader extends Connector<PostgresLoaderOptions> {
  private sql = postgres(process.env.DATABASE_URL || '')

  async connect(): Promise<void> {
    await this.sql`select 1` // simple ping
  }

  async *load(): AsyncGenerator<unknown> {
    const rows = await this.sql.unsafe(this.options.query)
    for (const row of rows) {
      yield row
    }
  }
}
