import { definePlugin } from "../define";
import type { ConnectorFactory } from "../types";
import { BlobServiceClient } from "@azure/storage-blob";
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
      datasetId: string; format?: FileKind;
      csv?: { delimiter?: string; headers?: boolean; rowsPerChunk?: number };
      text?: { maxTokens?: number; overlap?: number };
      pdf?: { maxTokens?: number; overlap?: number };
      docx?: { maxTokens?: number; overlap?: number };
      html?: { maxTokens?: number; overlap?: number };
      ocr?: { lang?: string; maxBytes?: number; maxTokens?: number; overlap?: number };
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
        const bodyStream = dl.readableStreamBody!;
        const metaEtag = dl.etag ?? null;
        const lastModified = dl.lastModified ? new Date(dl.lastModified) : null;
        const format = options?.format ?? detectKindFromPath(name);

        if (format === "csv") {
          const dl2 = await blob.download();
          const { sha1, length } = await hashStreamSHA1(dl2.readableStreamBody!);
          const rows: Record<string, any>[] = [];
          for await (const row of parseCsv(bodyStream, { delimiter: options?.csv?.delimiter, headers: options?.csv?.headers })) {
            rows.push(row);
            if (rows.length >= 5000) break;
          }
          const chunks = rowsToChunks(rows, { rowsPerChunk: options?.csv?.rowsPerChunk ?? 100 });
          const res = await saveDocumentWithChunksDedup({ orgId: "", datasetId: options!.datasetId, source: `az://${contName}/${name}`, title: name.split("/").pop(), mimeType: "text/csv", contentSha1: sha1, rawBytesLen: length, sourceEtag: metaEtag, sourceMtime: lastModified, chunks });
          if (!res.deduped) count += 1;
        } else {
          const { sha1, length, buffer } = await hashStreamSHA1(bodyStream as any);
          let title = name.split("/").pop();
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

          const res = await saveDocumentWithChunksDedup({ orgId: "", datasetId: options!.datasetId, source: `az://${contName}/${name}`, title, mimeType, contentSha1: sha1, rawBytesLen: length, sourceEtag: metaEtag, sourceMtime: lastModified, chunks });
          if (!res.deduped) count += 1;
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
