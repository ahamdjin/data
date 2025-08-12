import { definePlugin } from "../define";
import type { ConnectorFactory } from "../types";
import { createMysqlAdapter } from "@/db/adapters/mysql";

const create: ConnectorFactory = (config) => {
  const url = String(config.url ?? "");
  if (!url) throw new Error("MySQL URL is required (e.g., mysql://user:pass@host:3306/db)");

  // Create a dedicated adapter instance (not global)
  const db = createMysqlAdapter(url);

  return {
    async testConnection() {
      try {
        await db.query("SELECT 1 as one");
        return { ok: true as const };
      } catch (e: any) {
        return { ok: false as const, error: e?.message ?? "MySQL connection failed" };
      }
    },

    async query<T = unknown>({ sql, params = [] }) {
      if (!sql) throw new Error("sql is required");
      // Read-only guard (basic)
      if (/^\s*(insert|update|delete|alter|create|drop|truncate|grant|revoke)\b/i.test(sql)) {
        throw new Error("MySQL connector is read-only in B7");
      }
      return db.query<T>(sql, params);
    },
  };
};

const manifest = definePlugin({
  id: "plugin-mysql",
  displayName: "MySQL",
  version: "0.1.0",
  connectors: [
    {
      spec: {
        id: "mysql",
        displayName: "MySQL",
        version: "0.1.0",
        capabilities: ["sql", "json", "fulltext"],
        configSchema: [
          {
            key: "url",
            label: "MySQL URL",
            type: "password",
            required: true,
            secret: true,
            description: "mysql://user:pass@host:3306/db?ssl=true",
          },
        ],
      },
      create,
    },
  ],
  tools: [],
});

export default manifest;
