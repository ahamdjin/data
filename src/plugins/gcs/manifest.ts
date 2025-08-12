import { definePlugin } from "../define";
import type { ConnectorFactory } from "../types";
import { Storage } from "@google-cloud/storage";
import { detectKindFromPath, FileKind } from "@/files/detect";
import { parseCsv } from "@/files/parsers/csv";
import { parseParquet } from "@/files/parsers/parquet";
import { parsePdfToChunks } from "@/files/parsers/pdf";
import { parseDocxToChunks } from "@/files/parsers/docx";
import { parseHtmlToChunks } from "@/files/parsers/html";
import { parseImageToChunks } from "@/files/parsers/ocr";
import { hashStreamSHA1 } from "@/files/hash";
import { rowsToChunks } from "@/files/rowsToChunks";
import { saveDocumentWithChunksDedup } from "@/ingest/saveDocumentWithChunksDedup";
import { chunkText } from "@/ingest/chunker";

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
      datasetId: string; format?: FileKind;
      csv?: { delimiter?: string; headers?: boolean; rowsPerChunk?: number };
      text?: { maxTokens?: number; overlap?: number };
      pdf?: { maxTokens?: number; overlap?: number };
      docx?: { maxTokens?: number; overlap?: number };
      html?: { maxTokens?: number; overlap?: number };
      ocr?: { lang?: string; maxBytes?: number; maxTokens?: number; overlap?: number };
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
        const [meta] = await file.getMetadata();
        const metaEtag = meta.etag ?? null;
        const lastModified = meta.updated ? new Date(meta.updated) : null;
        const format = options?.format ?? detectKindFromPath(key);

        if (format === "csv") {
          const { sha1, length } = await hashStreamSHA1(file.createReadStream());
          const stream = file.createReadStream();
          const rows: Record<string, any>[] = [];
          for await (const row of parseCsv(stream, { delimiter: options?.csv?.delimiter, headers: options?.csv?.headers })) {
            rows.push(row);
            if (rows.length >= 5000) break;
          }
          const chunks = rowsToChunks(rows, { rowsPerChunk: options?.csv?.rowsPerChunk ?? 100 });
          const res = await saveDocumentWithChunksDedup({ orgId: "", datasetId: options!.datasetId, source: `gs://${bucket}/${key}`, title: key.split("/").pop(), mimeType: "text/csv", contentSha1: sha1, rawBytesLen: length, sourceEtag: metaEtag, sourceMtime: lastModified, chunks });
          if (!res.deduped) count += 1;
        } else {
          const { sha1, length, buffer } = await hashStreamSHA1(file.createReadStream());
          let title = key.split("/").pop();
          let mimeType = "application/octet-stream";
          let chunks: { ordinal: number; content: string }[] = [];

          if (format === "parquet") {
            mimeType = "application/parquet";
            const rows: Record<string, any>[] = [];
            for await (const r of parseParquet(buffer!)) {
              rows.push(r);
              if (rows.length >= 5000) break;
            }
            chunks = rowsToChunks(rows);
          } else if (format === "pdf") {
            mimeType = "application/pdf";
            chunks = await parsePdfToChunks(buffer!, options?.pdf);
          } else if (format === "docx") {
            mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            chunks = await parseDocxToChunks(buffer!, options?.docx);
          } else if (format === "html") {
            mimeType = "text/html";
            const html = buffer!.toString("utf8");
            const out = parseHtmlToChunks(html, options?.html);
            title = out.title ?? title;
            chunks = out.chunks;
          } else if (format === "image") {
            mimeType = "image/*";
            chunks = await parseImageToChunks(buffer!, options?.ocr);
          } else {
            mimeType = "text/plain";
            const text = buffer!.toString("utf8");
            chunks = chunkText(text, { maxTokens: options?.text?.maxTokens ?? 5000, overlap: options?.text?.overlap ?? 200 });
          }

          const res = await saveDocumentWithChunksDedup({ orgId: "", datasetId: options!.datasetId, source: `gs://${bucket}/${key}`, title, mimeType, contentSha1: sha1, rawBytesLen: length, sourceEtag: metaEtag, sourceMtime: lastModified, chunks });
          if (!res.deduped) count += 1;
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
