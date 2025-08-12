CREATE TABLE IF NOT EXISTS audit_llm_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  at timestamptz NOT NULL DEFAULT now(),
  model text NOT NULL,
  operation text NOT NULL,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer,
  prompt_hash text,
  meta jsonb
);
CREATE INDEX IF NOT EXISTS idx_audit_llm_org ON audit_llm_calls(organization_id, at DESC);

CREATE TABLE IF NOT EXISTS audit_search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  at timestamptz NOT NULL DEFAULT now(),
  dataset_id uuid,
  query text NOT NULL,
  top_k integer,
  latency_ms integer,
  meta jsonb
);
CREATE INDEX IF NOT EXISTS idx_audit_search_org ON audit_search_queries(organization_id, at DESC);

ALTER TABLE audit_llm_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_search_queries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname='audit_llm_rls_select') THEN
    CREATE POLICY audit_llm_rls_select ON audit_llm_calls
      FOR SELECT USING (organization_id = app.get_current_org());
    CREATE POLICY audit_llm_rls_insert ON audit_llm_calls
      FOR INSERT WITH CHECK (organization_id = app.get_current_org());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname='audit_search_rls_select') THEN
    CREATE POLICY audit_search_rls_select ON audit_search_queries
      FOR SELECT USING (organization_id = app.get_current_org());
    CREATE POLICY audit_search_rls_insert ON audit_search_queries
      FOR INSERT WITH CHECK (organization_id = app.get_current_org());
  END IF;
END$$;
