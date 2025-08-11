import { definePlugin } from "../define";
import type { ConnectorFactory } from "../types";

const create: ConnectorFactory = (config) => {
  const baseUrl = config.baseUrl as string;
  const apiKey = config.apiKey as string | undefined;

  async function call<T = any>(path: string, body: any) {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "Authorization": `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
    }
    return (await res.json()) as T;
  }

  return {
    async testConnection() {
      try {
        await call("/health", {});
        return { ok: true as const };
      } catch (e: any) {
        return { ok: false as const, error: e?.message ?? "Unknown error" };
      }
    },

    async query<T = unknown>({ path = "/query", body, sql, params }) {
      // Support either generic /query { sql, params } or a custom body
      const payload = body ?? (sql ? { sql, params } : {});
      const out = await call<{ rows: T[] }>(path, payload);
      return out.rows ?? [];
    },

    async ingest({ source, options }) {
      const out = await call<{ count: number }>("/ingest", { source, options });
      return { count: out.count ?? 0 };
    },
  };
};

const manifest = definePlugin({
  id: "plugin-custom-http",
  displayName: "Custom HTTP",
  version: "0.1.0",
  connectors: [
    {
      spec: {
        id: "custom-http",
        displayName: "Custom HTTP",
        version: "0.1.0",
        capabilities: ["http", "ingest"],
        configSchema: [
          { key: "baseUrl", label: "Base URL", type: "string", required: true, description: "e.g. https://my-data-api" },
          { key: "apiKey", label: "API Key", type: "password", required: false, secret: true },
        ],
      },
      create,
    },
  ],
  tools: [],
});

export default manifest;
