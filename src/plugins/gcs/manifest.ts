import { definePlugin } from "../define";
import type { ConnectorFactory } from "../types";
import { Storage } from "@google-cloud/storage";
import { detectKindFromPath } from "@/files/detect";
import { parseCsv } from "@/files/parsers/csv";
import { parseParquet, readStreamToBuffer } from "@/files/parsers/parquet";
import { parseTextToChunks } from "@/files/parsers/text";
import { rowsToChunks } from "@/files/rowsToChunks";
import { saveDocumentWithChunks } from "@/ingest/saveDocumentWithChunks";

const create: ConnectorFactory = (config) => {
  const saJson = config.serviceAccountJson ? (typeof config.serviceAccountJson === "string" ? JSON.parse(config.serviceAccountJson) : config.serviceAccountJson) : undefined;
  const storage = new Storage({ credentials: saJson }); // falls back to ADC if absent
  const defaultBucket = config.bucket ? String(config.bucket) : undefined;

  return {
    async testConnection() {
      try {
        if (defaultBucket) await storage.bucket(defaultBucket).getMetadata();
        return { ok: true as const };
      } catch (e: any) {
        return { ok: false as const, error: e?.message ?? "GCS failed" };
      }
    },

    async ingest({ source, options }: { source: string; options?: {
      bucket?: string; prefix?: string; object?: string;
      datasetId: string; format?: "csv"|"parquet"|"text";
      csv?: { delimiter?: string; headers?: boolean; rowsPerChunk?: number };
      text?: { maxTokens?: number; overlap?: number };
      limitFiles?: number;
    } }) {
      const bucket = options?.bucket ?? defaultBucket;
      if (!bucket) throw new Error("bucket required");
      const b = storage.bucket(bucket);
      const limit = options?.limitFiles ?? 100;

      const targets: string[] = [];
      if (options?.object) {
        targets.push(options.object);
      } else {
        const [files] = await b.getFiles({ prefix: options?.prefix ?? source, autoPaginate: false, maxResults: limit });
        for (const f of files) targets.push(f.name);
      }

      let count = 0;
      for (const key of targets) {
        const file = b.file(key);
        const stream = file.createReadStream();
        const format = options?.format ?? detectKindFromPath(key);

        if (format === "csv") {
          const rows: Record<string, any>[] = [];
          for await (const row of parseCsv(stream, { delimiter: options?.csv?.delimiter, headers: options?.csv?.headers })) {
            rows.push(row);
            if (rows.length >= 5000) break;
          }
          const chunks = rowsToChunks(rows, { rowsPerChunk: options?.csv?.rowsPerChunk ?? 100 });
          await saveDocumentWithChunks({ orgId: "", datasetId: options!.datasetId, source: `gs://${bucket}/${key}`, mimeType: "text/jsonl", title: key.split("/").pop(), chunks });
          count += 1;
        } else if (format === "parquet") {
          const buf = await readStreamToBuffer(stream);
          const rows: Record<string, any>[] = [];
          for await (const r of parseParquet(buf)) {
            rows.push(r);
            if (rows.length >= 5000) break;
          }
          const chunks = rowsToChunks(rows);
          await saveDocumentWithChunks({ orgId: "", datasetId: options!.datasetId, source: `gs://${bucket}/${key}`, mimeType: "application/parquet", title: key.split("/").pop(), chunks });
          count += 1;
        } else {
          const chunks = await parseTextToChunks(stream, options?.text);
          await saveDocumentWithChunks({ orgId: "", datasetId: options!.datasetId, source: `gs://${bucket}/${key}`, mimeType: "text/plain", title: key.split("/").pop(), chunks });
          count += 1;
        }
      }

      return { count };
    },
  };
};

const manifest = definePlugin({
  id: "plugin-gcs",
  displayName: "Google Cloud Storage",
  version: "0.1.0",
  connectors: [
    {
      spec: {
        id: "gcs",
        displayName: "GCS",
        version: "0.1.0",
        capabilities: ["files", "ingest", "json"],
        configSchema: [
          { key: "bucket", label: "Default Bucket", type: "string", required: false },
          { key: "serviceAccountJson", label: "Service Account JSON", type: "json", required: false },
        ],
      },
      create,
    },
  ],
  tools: [],
});

export default manifest;
