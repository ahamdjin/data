import { definePlugin } from "../define";
import type { ConnectorFactory } from "../types";
import { ConnectorSpecZ, CapabilityZ } from "../types";
import { getAdapter } from "@/db/registry";

const create: ConnectorFactory = (config: Record<string, any>) => {
  // choose adapter by name; falls back to 'default' (A1 bootstrap)
  const name = (config.databaseName as string) || "default";
  const db = getAdapter(name);

  return {
    async testConnection() {
      try {
        await db.query("SELECT 1 as one");
        return { ok: true as const };
      } catch (e: any) {
        return { ok: false as const, error: e?.message ?? "Unknown error" };
      }
    },

    async query<T = unknown>({ sql, params = [] }) {
      if (!sql) throw new Error("sql is required for Postgres connector");
      const rows = await db.query<T>(sql, params);
      return rows;
    },

    async upsertEmbedding({ table, id, vector, payload }) {
      if (!db.upsertEmbedding) throw new Error("Vector not supported by this adapter");
      await db.upsertEmbedding({ table, id, vector, payload });
    },

    async similar({ table, vector, topK }) {
      if (!db.similar) throw new Error("Vector search not supported by this adapter");
      return db.similar({ table, vector, topK });
    },
  };
};

const manifest = definePlugin({
  id: "plugin-postgres-basic",
  displayName: "Postgres (Basic)",
  version: "0.1.0",
  connectors: [
    {
      spec: {
        id: "postgres-basic",
        displayName: "Postgres",
        version: "0.1.0",
        capabilities: ["sql", "vector", "json", "fulltext"],
        configSchema: [
          {
            key: "databaseName",
            label: "Adapter Name",
            type: "string",
            required: false,
            description: "Adapter to use (default = 'default'). Set via DATABASE_URL or DATABASE_URL_<NAME>.",
          },
        ],
      },
      create,
    },
  ],
  tools: [],
});

export default manifest;
