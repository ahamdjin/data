import { definePlugin } from "../define";
import type { ConnectorFactory } from "../types";
import { createSqliteAdapter } from "@/db/adapters/sqlite";

const create: ConnectorFactory = (config) => {
  const url = String(config.url ?? "");
  const authToken = config.authToken ? String(config.authToken) : undefined;
  if (!url) throw new Error("SQLite URL is required (libsql/Turso) e.g., libsql://<db>-<org>.turso.io");

  const db = createSqliteAdapter({ url, authToken });

  return {
    async testConnection() {
      try {
        await db.query("SELECT 1 as one");
        return { ok: true as const };
      } catch (e: any) {
        return { ok: false as const, error: e?.message ?? "SQLite (libsql) connection failed" };
      }
    },

    async query<T = unknown>({ sql, params = [] }) {
      if (!sql) throw new Error("sql is required");
      // Read-only guard
      if (/^\s*(insert|update|delete|alter|create|drop|truncate|grant|revoke)\b/i.test(sql)) {
        throw new Error("SQLite connector is read-only in B7");
      }
      return db.query<T>(sql, params);
    },
  };
};

const manifest = definePlugin({
  id: "plugin-sqlite",
  displayName: "SQLite (libsql/Turso)",
  version: "0.1.0",
  connectors: [
    {
      spec: {
        id: "sqlite",
        displayName: "SQLite (libsql/Turso)",
        version: "0.1.0",
        capabilities: ["sql", "json", "fulltext"],
        configSchema: [
          {
            key: "url",
            label: "libsql URL",
            type: "string",
            required: true,
            description: "e.g., libsql://your-db-username.turso.io",
          },
          {
            key: "authToken",
            label: "Auth Token",
            type: "password",
            required: false,
            secret: true,
            description: "Turso auth token if required",
          },
        ],
      },
      create,
    },
  ],
  tools: [],
});

export default manifest;
