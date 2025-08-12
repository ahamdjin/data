import { getAdapter } from "@/db/registry";

export async function saveDocumentWithChunks(opts: {
  orgId: string;
  datasetId: string;
  source: string;
  mimeType?: string;
  title?: string;
  chunks: Array<{ ordinal: number; content: string; meta?: Record<string, any> }>;
}) {
  const db = getAdapter("default");
  const [{ id: docId }] = await db.query<{ id: string }>(
    `INSERT INTO documents (organization_id, dataset_id, source, mime_type, title, meta)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [opts.orgId, opts.datasetId, opts.source, opts.mimeType ?? null, opts.title ?? null, null]
  );

  for (const c of opts.chunks) {
    await db.query(
      `INSERT INTO document_chunks (organization_id, dataset_id, document_id, ordinal, content, meta)
       VALUES ($1, $2, $3, $4, $5, $6)` ,
      [opts.orgId, opts.datasetId, docId, c.ordinal, c.content, c.meta ?? null]
    );
  }

  return { documentId: docId, chunks: opts.chunks.length };
}
