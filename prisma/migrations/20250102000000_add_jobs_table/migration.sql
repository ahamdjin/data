CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type text NOT NULL,
  status text NOT NULL,
  progress integer NOT NULL DEFAULT 0,
  payload jsonb,
  result jsonb,
  error text,
  idempotency_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_org ON jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_jobs_idem ON jobs(idempotency_key) WHERE idempotency_key IS NOT NULL;

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname='jobs_rls_select') THEN
    CREATE POLICY jobs_rls_select ON jobs
      FOR SELECT USING (organization_id = app.get_current_org());
    CREATE POLICY jobs_rls_insert ON jobs
      FOR INSERT WITH CHECK (organization_id = app.get_current_org());
    CREATE POLICY jobs_rls_update ON jobs
      FOR UPDATE USING (organization_id = app.get_current_org()) WITH CHECK (organization_id = app.get_current_org());
    CREATE POLICY jobs_rls_delete ON jobs
      FOR DELETE USING (organization_id = app.get_current_org());
  END IF;
END$$;
