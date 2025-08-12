import { definePlugin } from "../define";
import type { ConnectorFactory } from "../types";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { detectKindFromPath } from "@/files/detect";
import { parseCsv } from "@/files/parsers/csv";
import { parseParquet, readStreamToBuffer } from "@/files/parsers/parquet";
import { parseTextToChunks } from "@/files/parsers/text";
import { rowsToChunks } from "@/files/rowsToChunks";
import { saveDocumentWithChunks } from "@/ingest/saveDocumentWithChunks";
import { Readable } from "node:stream";

function streamFromBody(body: any): NodeJS.ReadableStream {
  if (body instanceof Readable) return body as any;
  if (body?.transformToWebStream) return Readable.fromWeb(body.transformToWebStream() as any);
  if (body?.pipe) return body;
  throw new Error("Unknown S3 body stream type");
}

const create: ConnectorFactory = (config) => {
  const region = String(config.region ?? "us-east-1");
  const credentials = config.accessKeyId && config.secretAccessKey
    ? { accessKeyId: String(config.accessKeyId), secretAccessKey: String(config.secretAccessKey) }
    : undefined; // allow IAM/instance role
  const client = new S3Client({ region, credentials });

  return {
    async testConnection() {
      try {
        if (config.bucket) {
          await client.send(new ListObjectsV2Command({ Bucket: String(config.bucket), MaxKeys: 1 }));
        }
        return { ok: true as const };
      } catch (e: any) {
        return { ok: false as const, error: e?.message ?? "S3 failed" };
      }
    },

    async ingest({ source, options }: { source: string; options?: {
      bucket?: string; prefix?: string; key?: string; // if key set, single object
      datasetId: string;
      format?: "csv"|"parquet"|"text";
      csv?: { delimiter?: string; headers?: boolean; rowsPerChunk?: number };
      text?: { maxTokens?: number; overlap?: number };
      limitFiles?: number;
    } }) {
      const bucket = String(options?.bucket ?? config.bucket ?? "");
      if (!bucket) throw new Error("bucket required");
      const limitFiles = options?.limitFiles ?? 100;

      const targets: { key: string }[] = [];

      if (options?.key) {
        targets.push({ key: options.key });
      } else {
        const prefix = options?.prefix ?? source;
        let ContinuationToken: string | undefined = undefined;
        while (targets.length < limitFiles) {
          const out = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken, MaxKeys: Math.min(1000, limitFiles - targets.length) }));
          for (const o of out.Contents ?? []) {
            if (o.Key) targets.push({ key: o.Key });
            if (targets.length >= limitFiles) break;
          }
          if (!out.IsTruncated) break;
          ContinuationToken = out.NextContinuationToken;
        }
      }

      let count = 0;
      for (const t of targets) {
        const get = await client.send(new GetObjectCommand({ Bucket: bucket, Key: t.key }));
        const stream = streamFromBody(get.Body);
        const format = options?.format ?? detectKindFromPath(t.key);

        if (format === "csv") {
          const rows: Record<string, any>[] = [];
          for await (const row of parseCsv(stream, { delimiter: options?.csv?.delimiter, headers: options?.csv?.headers })) {
            rows.push(row);
            if (rows.length >= 5000) break;
          }
          const chunks = rowsToChunks(rows, { rowsPerChunk: options?.csv?.rowsPerChunk ?? 100 });
          await saveDocumentWithChunks({
            orgId: "",
            datasetId: options!.datasetId,
            source: `s3://${bucket}/${t.key}`,
            mimeType: "text/jsonl",
            title: t.key.split("/").pop(),
            chunks,
          });
          count += 1;
        } else if (format === "parquet") {
          const buf = await readStreamToBuffer(stream);
          const rows: Record<string, any>[] = [];
          for await (const r of parseParquet(buf)) {
            rows.push(r);
            if (rows.length >= 5000) break;
          }
          const chunks = rowsToChunks(rows, { rowsPerChunk: 100 });
          await saveDocumentWithChunks({
            orgId: "",
            datasetId: options!.datasetId,
            source: `s3://${bucket}/${t.key}`,
            mimeType: "application/parquet",
            title: t.key.split("/").pop(),
            chunks,
          });
          count += 1;
        } else {
          const chunks = await parseTextToChunks(stream, options?.text);
          await saveDocumentWithChunks({
            orgId: "",
            datasetId: options!.datasetId,
            source: `s3://${bucket}/${t.key}`,
            mimeType: "text/plain",
            title: t.key.split("/").pop(),
            chunks,
          });
          count += 1;
        }
      }

      return { count };
    },
  };
};

const manifest = definePlugin({
  id: "plugin-s3",
  displayName: "Amazon S3",
  version: "0.1.0",
  connectors: [
    {
      spec: {
        id: "s3",
        displayName: "S3",
        version: "0.1.0",
        capabilities: ["files", "ingest", "json"],
        configSchema: [
          { key: "region", label: "Region", type: "string", required: true, defaultValue: "us-east-1" },
          { key: "bucket", label: "Default Bucket", type: "string", required: false },
          { key: "accessKeyId", label: "Access Key ID", type: "password", required: false, secret: true },
          { key: "secretAccessKey", label: "Secret Access Key", type: "password", required: false, secret: true },
        ],
      },
      create,
    },
  ],
  tools: [],
});

export default manifest;
