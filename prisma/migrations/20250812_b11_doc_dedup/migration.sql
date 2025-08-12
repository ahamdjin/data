ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS content_sha1 text,
  ADD COLUMN IF NOT EXISTS source_etag text,
  ADD COLUMN IF NOT EXISTS source_mtime timestamptz,
  ADD COLUMN IF NOT EXISTS raw_bytes_len bigint;

-- Allow multiple versions per source, but prevent duplicates of the same bits.
-- Partial unique index so NULL hash doesn't block.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_documents_version
ON documents (organization_id, dataset_id, source, content_sha1)
WHERE content_sha1 IS NOT NULL;
