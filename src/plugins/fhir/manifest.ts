import { definePlugin } from "../define";
import type { ConnectorFactory } from "../types";
import { z } from "zod";
import { getJSON } from "@/connectors/fhir/client";

const ConfigZ = z.object({
  baseUrl: z.string().url(),
  auth: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("bearer"), token: z.string() }),
    z.object({ kind: z.literal("basic"), username: z.string(), password: z.string() }),
    z.object({ kind: z.literal("none") }),
  ]).default({ kind: "none" }),
});

const create: ConnectorFactory = (configRaw) => {
  const cfg = ConfigZ.parse(configRaw);

  return {
    async testConnection() {
      try {
        await getJSON(`${cfg.baseUrl}/metadata`, cfg.auth);
        return { ok: true as const };
      } catch (e: any) {
        return { ok: false as const, error: e?.message ?? "FHIR /metadata failed" };
      }
    },

    // Optional: direct query in future; for now we focus on ingest()
    async ingest({ source, options }: { source: string; options?: any }) {
      // This connector is used via the fhir.ingest job; actual logic lives in the worker.
      return { count: 0 };
    },
  };
};

const manifest = definePlugin({
  id: "plugin-fhir",
  displayName: "FHIR (HL7)",
  version: "0.1.0",
  connectors: [
    {
      spec: {
        id: "fhir",
        displayName: "FHIR Server",
        version: "0.1.0",
        capabilities: ["json", "ingest"],
        configSchema: [
          { key: "baseUrl", label: "Base URL", type: "string", required: true },
          { key: "auth.kind", label: "Auth Type", type: "select", required: true, choices: ["bearer","basic","none"], defaultValue: "none" },
          { key: "auth.token", label: "Bearer Token", type: "password", required: false, secret: true },
          { key: "auth.username", label: "Username", type: "string", required: false },
          { key: "auth.password", label: "Password", type: "password", required: false, secret: true },
        ],
      },
      create,
    },
  ],
  tools: [],
});

export default manifest;
