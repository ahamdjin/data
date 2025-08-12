import { definePlugin } from "../define";
import type { ConnectorFactory } from "../types";
import { BlobServiceClient } from "@azure/storage-blob";
import { detectKindFromPath } from "@/files/detect";
import { parseCsv } from "@/files/parsers/csv";
import { parseParquet, readStreamToBuffer } from "@/files/parsers/parquet";
import { parseTextToChunks } from "@/files/parsers/text";
import { rowsToChunks } from "@/files/rowsToChunks";
import { saveDocumentWithChunks } from "@/ingest/saveDocumentWithChunks";

const create: ConnectorFactory = (config) => {
  const connectionString = config.connectionString ? String(config.connectionString) : undefined;
  const url = config.accountUrl ? String(config.accountUrl) : undefined;        // e.g. https://<account>.blob.core.windows.net
  const sasToken = config.sasToken ? String(config.sasToken) : undefined;
  const container = config.container ? String(config.container) : undefined;

  const client = connectionString
    ? BlobServiceClient.fromConnectionString(connectionString)
    : new BlobServiceClient(`${url}${sasToken ? `?${sasToken}` : ""}`);

  return {
    async testConnection() {
      try {
        if (container) {
          const cont = client.getContainerClient(container);
          await cont.getProperties();
        }
        return { ok: true as const };
      } catch (e: any) {
        return { ok: false as const, error: e?.message ?? "Azure Blob failed" };
      }
    },

    async ingest({ source, options }: { source: string; options?: {
      container?: string; prefix?: string; blob?: string;
      datasetId: string; format?: "csv"|"parquet"|"text";
      csv?: { delimiter?: string; headers?: boolean; rowsPerChunk?: number };
      text?: { maxTokens?: number; overlap?: number };
      limitFiles?: number;
    } }) {
      const contName = options?.container ?? container;
      if (!contName) throw new Error("container required");
      const cont = client.getContainerClient(contName);
      const limit = options?.limitFiles ?? 100;

      const targets: string[] = [];
      if (options?.blob) targets.push(options.blob);
      else {
        let iter = cont.listBlobsFlat({ prefix: options?.prefix ?? source }).byPage({ maxPageSize: Math.min(5000, limit) });
        for await (const page of iter) {
          for (const item of page.segment.blobItems) {
            targets.push(item.name);
            if (targets.length >= limit) break;
          }
          if (targets.length >= limit) break;
        }
      }

      let count = 0;
      for (const name of targets) {
        const blob = cont.getBlobClient(name);
        const dl = await blob.download();
        const stream = dl.readableStreamBody!;
        const format = options?.format ?? detectKindFromPath(name);

        if (format === "csv") {
          const rows: Record<string, any>[] = [];
          for await (const row of parseCsv(stream, { delimiter: options?.csv?.delimiter, headers: options?.csv?.headers })) {
            rows.push(row);
            if (rows.length >= 5000) break;
          }
          const chunks = rowsToChunks(rows, { rowsPerChunk: options?.csv?.rowsPerChunk ?? 100 });
          await saveDocumentWithChunks({ orgId: "", datasetId: options!.datasetId, source: `az://${contName}/${name}`, mimeType: "text/jsonl", title: name.split("/").pop(), chunks });
          count += 1;
        } else if (format === "parquet") {
          const buf = await readStreamToBuffer(stream as any);
          const rows: Record<string, any>[] = [];
          for await (const r of parseParquet(buf)) {
            rows.push(r);
            if (rows.length >= 5000) break;
          }
          const chunks = rowsToChunks(rows);
          await saveDocumentWithChunks({ orgId: "", datasetId: options!.datasetId, source: `az://${contName}/${name}`, mimeType: "application/parquet", title: name.split("/").pop(), chunks });
          count += 1;
        } else {
          const chunks = await parseTextToChunks(stream as any, options?.text);
          await saveDocumentWithChunks({ orgId: "", datasetId: options!.datasetId, source: `az://${contName}/${name}`, mimeType: "text/plain", title: name.split("/").pop(), chunks });
          count += 1;
        }
      }

      return { count };
    },
  };
};

const manifest = definePlugin({
  id: "plugin-azure-blob",
  displayName: "Azure Blob Storage",
  version: "0.1.0",
  connectors: [
    {
      spec: {
        id: "azure-blob",
        displayName: "Azure Blob",
        version: "0.1.0",
        capabilities: ["files", "ingest", "json"],
        configSchema: [
          { key: "connectionString", label: "Connection String", type: "password", required: false, secret: true },
          { key: "accountUrl", label: "Account URL", type: "string", required: false, description: "https://<account>.blob.core.windows.net" },
          { key: "sasToken", label: "SAS Token", type: "password", required: false, secret: true },
          { key: "container", label: "Default Container", type: "string", required: false },
        ],
      },
      create,
    },
  ],
  tools: [],
});

export default manifest;
