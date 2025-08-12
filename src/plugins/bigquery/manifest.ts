import { definePlugin } from "../define";
import type { ConnectorFactory } from "../types";
import { BigQuery } from "@google-cloud/bigquery";
import { toBqNamedParams } from "@/db/sql/bigquery";

const create: ConnectorFactory = (config) => {
  // Either rely on ADC (GOOGLE_APPLICATION_CREDENTIALS) or accept inline JSON
  const projectId = config.projectId ? String(config.projectId) : undefined;
  const location = config.location ? String(config.location) : undefined;
  const saJson = config.serviceAccountJson ? (typeof config.serviceAccountJson === "string" ? JSON.parse(config.serviceAccountJson) : config.serviceAccountJson) : undefined;

  const client = new BigQuery({
    projectId,
    location,
    credentials: saJson ? {
      client_email: saJson.client_email,
      private_key: saJson.private_key,
    } : undefined,
  });

  return {
    async testConnection() {
      try {
        // trivial query
        const [rows] = await client.query({ query: "SELECT 1 AS one", params: {} });
        return { ok: true as const };
      } catch (e: any) {
        return { ok: false as const, error: e?.message ?? "BigQuery connection failed" };
      }
    },

    async query<T = unknown>({ sql, params = [] }) {
      if (!sql) throw new Error("sql is required");
      // Read-only guard (very permissive; you can tighten with a policy layer)
      if (/^\s*(insert|update|delete|merge|alter|create|drop|truncate|grant|revoke)\b/i.test(sql)) {
        throw new Error("BigQuery connector is read-only in B9");
      }
      const { q, named } = toBqNamedParams(sql, params);
      const [rows] = await client.query({ query: q, params: named });
      return rows as T[];
    },
  };
};

const manifest = definePlugin({
  id: "plugin-bigquery",
  displayName: "BigQuery",
  version: "0.1.0",
  connectors: [
    {
      spec: {
        id: "bigquery",
        displayName: "Google BigQuery",
        version: "0.1.0",
        capabilities: ["sql", "json"],
        configSchema: [
          { key: "projectId", label: "Project ID", type: "string", required: false, description: "If empty, uses ADC env" },
          { key: "location", label: "Location", type: "string", required: false, description: "e.g., US, EU" },
          { key: "serviceAccountJson", label: "Service Account JSON", type: "json", required: false, description: "Optional; otherwise set GOOGLE_APPLICATION_CREDENTIALS" },
        ],
      },
      create,
    },
  ],
  tools: [],
});

export default manifest;
