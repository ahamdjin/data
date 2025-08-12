import type { DbAdapter, QueryParams } from "../Adapter";
import { toQuestionParams } from "../sql/paramstyle";
import mysql from "mysql2/promise";

export function createMysqlAdapter(url: string): DbAdapter {
  const pool = mysql.createPool(url);

  return {
    name: "mysql",
    capabilities: ["sql", "json", "fulltext"],

    async query<T = unknown>(sql: string, params: QueryParams = []) {
      const { q, args } = toQuestionParams(sql, params);
      const [rows] = await pool.execute(q, args as any[]);
      return rows as T[];
    },

    async close() { await pool.end(); },
  };
}
