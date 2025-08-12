import type { DbAdapter, QueryParams } from "../Adapter";
import { createClient, Client } from "@libsql/client";
import { toQuestionParams } from "../sql/paramstyle";

export function createSqliteAdapter(opts: { url: string; authToken?: string }): DbAdapter {
  const client: Client = createClient({ url: opts.url, authToken: opts.authToken });

  return {
    name: "sqlite",
    capabilities: ["sql", "json", "fulltext"],

    async query<T = unknown>(sql: string, params: QueryParams = []) {
      const { q, args } = toQuestionParams(sql, params);
      const res = await client.execute({ sql: q, args: args as any[] });
      // libsql returns { rows } with plain objects
      // @ts-ignore
      return (res.rows ?? []) as T[];
    },

    async close() { /* libsql is HTTP; no explicit close needed */ },
  };
}
