-- Datasets table exists (from A4 example). We’ll hang documents off that.

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  dataset_id uuid NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  source text NOT NULL,
  mime_type text,
  title text,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_dataset ON documents(dataset_id);

-- pgvector extension (if not enabled)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  dataset_id uuid NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  ordinal integer NOT NULL,
  content text NOT NULL,
  embedding vector(1536),
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_id, ordinal)
);

CREATE INDEX IF NOT EXISTS idx_chunks_org ON document_chunks(organization_id);
CREATE INDEX IF NOT EXISTS idx_chunks_dataset ON document_chunks(dataset_id);
CREATE INDEX IF NOT EXISTS idx_chunks_doc ON document_chunks(document_id);

-- RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname='documents_rls_select') THEN
    CREATE POLICY documents_rls_select ON documents
      FOR SELECT USING (organization_id = app.get_current_org());
    CREATE POLICY documents_rls_mod_ins ON documents
      FOR INSERT WITH CHECK (organization_id = app.get_current_org());
    CREATE POLICY documents_rls_mod_upd ON documents
      FOR UPDATE USING (organization_id = app.get_current_org()) WITH CHECK (organization_id = app.get_current_org());
    CREATE POLICY documents_rls_mod_del ON documents
      FOR DELETE USING (organization_id = app.get_current_org());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname='chunks_rls_select') THEN
    CREATE POLICY chunks_rls_select ON document_chunks
      FOR SELECT USING (organization_id = app.get_current_org());
    CREATE POLICY chunks_rls_mod_ins ON document_chunks
      FOR INSERT WITH CHECK (organization_id = app.get_current_org());
    CREATE POLICY chunks_rls_mod_upd ON document_chunks
      FOR UPDATE USING (organization_id = app.get_current_org()) WITH CHECK (organization_id = app.get_current_org());
    CREATE POLICY chunks_rls_mod_del ON document_chunks
      FOR DELETE USING (organization_id = app.get_current_org());
  END IF;
END$$;
