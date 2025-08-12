CREATE TABLE IF NOT EXISTS ingest_cursors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  dataset_id uuid NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  source text NOT NULL,
  mode text NOT NULL,
  resource_types text[] NOT NULL,
  since timestamptz,
  resume_url text,
  resume_next text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, dataset_id, source, mode)
);

ALTER TABLE ingest_cursors ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname='ingest_cursors_rls') THEN
    CREATE POLICY ingest_cursors_rls ON ingest_cursors
      USING (organization_id = app.get_current_org())
      WITH CHECK (organization_id = app.get_current_org());
  END IF;
END$$;
