import { sql } from '@/providers/db';
import { generateUUID } from '@/lib/utils';
import { Connector, Document } from './base';
import { embedChunks } from '@/lib/embedChunks';

/**
 * Loads documents from a Postgres query.
 */
export class PostgresLoader extends Connector {
  constructor(private query: string) {
    super();
  }

  async load(): Promise<Document[]> {
    const rows = await sql.unsafe(this.query);
    const docs = rows.map((row: any) => ({
      id: String(row.id ?? generateUUID()),
      text: JSON.stringify(row),
    }));
    if (docs.length) {
      await embedChunks(docs.map((d) => d.text));
    }
    return docs;
  }
}
