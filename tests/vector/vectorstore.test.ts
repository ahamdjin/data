import { describe, it, expect } from "vitest";
import { createPgvectorStore } from "@/vector/adapters/pgvector";
import { getAdapter } from "@/db/registry";

const url = process.env.DATABASE_URL;

(url ? describe : describe.skip)("pgvector store upsert", () => {
  it("updates embeddings for known chunks", async () => {
    const db = getAdapter("default");
    const [{ id: orgId }] = await db.query<{ id: string }>(
      `INSERT INTO organizations (name) VALUES ('Org') RETURNING id`
    );
    const [{ id: dsId }] = await db.query<{ id: string }>(
      `INSERT INTO datasets (organization_id, name) VALUES ($1,'DS') RETURNING id`,
      [orgId]
    );
    const [{ id: docId }] = await db.query<{ id: string }>(
      `INSERT INTO documents (organization_id, dataset_id, source) VALUES ($1,$2,'src') RETURNING id`,
      [orgId, dsId]
    );
    const [{ id: chunkId }] = await db.query<{ id: string }>(
      `INSERT INTO document_chunks (organization_id, dataset_id, document_id, ordinal, content) VALUES ($1,$2,$3,0,'hello') RETURNING id`,
      [orgId, dsId, docId]
    );

    const store = createPgvectorStore(1536);
    await store.upsert({ namespace: `${orgId}:${dsId}`, vectors: [{ id: chunkId, vector: new Array(1536).fill(0.01) }] });

    const [row] = await db.query<{ embedding: any }>(
      `SELECT embedding FROM document_chunks WHERE id = $1`,
      [chunkId]
    );
    expect(row.embedding).toBeTruthy();
  });
});
