import { getAdapter } from "@/db/registry";

export async function saveDocumentWithChunksDedup(opts: {
  orgId: string;
  datasetId: string;
  source: string;
  title?: string;
  mimeType?: string;
  contentSha1?: string | null;
  rawBytesLen?: number | null;
  sourceEtag?: string | null;
  sourceMtime?: Date | null;
  chunks: Array<{ ordinal: number; content: string; meta?: Record<string, any> }>;
}) {
  const db = getAdapter("default");

  // Try insert; if duplicate (same hash), return early
  const meta = { etag: opts.sourceEtag, mtime: opts.sourceMtime ? opts.sourceMtime.toISOString() : undefined };

  const rows = await db.query<{ id: string }>(
    `INSERT INTO documents (organization_id, dataset_id, source, mime_type, title, meta, content_sha1, raw_bytes_len, source_etag, source_mtime)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10)
     ON CONFLICT (organization_id, dataset_id, source, content_sha1)
     DO NOTHING
     RETURNING id`,
    [opts.orgId, opts.datasetId, opts.source, opts.mimeType ?? null, opts.title ?? null, JSON.stringify(meta),
     opts.contentSha1 ?? null, opts.rawBytesLen ?? null, opts.sourceEtag ?? null, opts.sourceMtime ?? null]
  );

  if (rows.length === 0) {
    // duplicate version; nothing to insert
    return { documentId: null, chunksInserted: 0, deduped: true };
  }

  const docId = rows[0].id;

  for (const c of opts.chunks) {
    await db.query(
      `INSERT INTO document_chunks (organization_id, dataset_id, document_id, ordinal, content, meta)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [opts.orgId, opts.datasetId, docId, c.ordinal, c.content, c.meta ?? null]
    );
  }

  return { documentId: docId, chunksInserted: opts.chunks.length, deduped: false };
}
