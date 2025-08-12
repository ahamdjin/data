import { definePlugin } from "../define";
import type { ConnectorFactory } from "../types";
import snowflake from "snowflake-sdk";
import { toQuestionParams } from "@/db/sql/paramstyle";

const create: ConnectorFactory = (config) => {
  // Support password or key-pair auth via config.env-like fields
  const connection = snowflake.createConnection({
    account: String(config.account),
    username: String(config.username),
    password: config.password ? String(config.password) : undefined,
    authenticator: config.authenticator ? String(config.authenticator) : undefined, // e.g., "SNOWFLAKE_JWT"
    privateKey: config.privateKey ? String(config.privateKey) : undefined,         // PEM if using key-pair
    warehouse: config.warehouse ? String(config.warehouse) : undefined,
    database: config.database ? String(config.database) : undefined,
    schema: config.schema ? String(config.schema) : undefined,
    role: config.role ? String(config.role) : undefined,
  });

  function connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      connection.connect((err) => (err ? reject(err) : resolve()));
    });
  }

  function execute<T>(sql: string, binds: unknown[]): Promise<T[]> {
    return new Promise((resolve, reject) => {
      connection.execute({
        sqlText: sql,
        binds,
        complete: (err, stmt, rows) => (err ? reject(err) : resolve(rows as T[])),
      });
    });
  }

  async function ensure() {
    if ((connection as any).isUp) return;
    await connect();
    (connection as any).isUp = true;
  }

  return {
    async testConnection() {
      try {
        await ensure();
        const r = await execute("SELECT 1 AS one", []);
        return { ok: true as const };
      } catch (e: any) {
        return { ok: false as const, error: e?.message ?? "Snowflake connection failed" };
      }
    },

    async query<T = unknown>({ sql, params = [] }) {
      if (!sql) throw new Error("sql is required");
      if (/^\s*(insert|update|delete|merge|alter|create|drop|truncate|grant|revoke)\b/i.test(sql)) {
        throw new Error("Snowflake connector is read-only in B9");
      }
      await ensure();
      const { q, args } = toQuestionParams(sql, params);
      const rows = await execute<T>(q, args);
      return rows;
    },
  };
};

const manifest = definePlugin({
  id: "plugin-snowflake",
  displayName: "Snowflake",
  version: "0.1.0",
  connectors: [
    {
      spec: {
        id: "snowflake",
        displayName: "Snowflake",
        version: "0.1.0",
        capabilities: ["sql", "json"],
        configSchema: [
          { key: "account", label: "Account", type: "string", required: true, description: "e.g., xy12345.eu-central-1" },
          { key: "username", label: "Username", type: "string", required: true },
          { key: "password", label: "Password", type: "password", required: false, secret: true },
          { key: "privateKey", label: "Private Key (PEM)", type: "password", required: false, secret: true, description: "Optional key-pair auth" },
          { key: "authenticator", label: "Authenticator", type: "string", required: false, description: "SNOWFLAKE_JWT / externalbrowser / okta, etc." },
          { key: "warehouse", label: "Warehouse", type: "string", required: false },
          { key: "database", label: "Database", type: "string", required: false },
          { key: "schema", label: "Schema", type: "string", required: false },
          { key: "role", label: "Role", type: "string", required: false },
        ],
      },
      create,
    },
  ],
  tools: [],
});

export default manifest;
