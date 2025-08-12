/* @vitest-environment node */
import { describe, it, expect } from "vitest";
import { getAdapter } from "@/db/registry";
import { saveDocumentWithChunksDedup } from "@/ingest/saveDocumentWithChunksDedup";

const url = process.env.DATABASE_URL;
(url ? describe : describe.skip)("dedup", () => {
  it("skips duplicate document versions", async () => {
    const db = getAdapter("default");
    const [{ id: orgId }] = await db.query(`INSERT INTO organizations (name) VALUES ('B11 Org') RETURNING id`);
    const [{ id: dsId }] = await db.query(`INSERT INTO datasets (organization_id, name) VALUES ($1,'DS') RETURNING id`, [orgId]);

    const p = { orgId, datasetId: dsId, source: "s3://bucket/report.pdf", contentSha1: "abc", rawBytesLen: 3, chunks: [{ ordinal:0, content:"hi"}] };
    const a = await saveDocumentWithChunksDedup({ ...p, mimeType: "application/pdf" });
    const b = await saveDocumentWithChunksDedup({ ...p, mimeType: "application/pdf" });

    expect(a.deduped).toBe(false);
    expect(b.deduped).toBe(true);

    const rows = await db.query<{ cnt: number }>(`SELECT COUNT(*)::int as cnt FROM documents WHERE organization_id=$1 AND dataset_id=$2 AND source=$3`, [orgId, dsId, p.source]);
    expect(rows[0].cnt).toBe(1);
  });
});
