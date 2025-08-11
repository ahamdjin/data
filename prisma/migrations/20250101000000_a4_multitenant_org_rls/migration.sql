-- Core tables
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  hashed_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  disabled boolean NOT NULL DEFAULT false
);

-- Example tenant-owned table
CREATE TABLE IF NOT EXISTS datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  meta jsonb
);

CREATE INDEX IF NOT EXISTS idx_datasets_org ON datasets(organization_id);

-- Existing table: FhirResource
ALTER TABLE "FhirResource" ADD COLUMN IF NOT EXISTS organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_fhirresource_org ON "FhirResource"(organization_id);

-- Enable RLS on tenant-owned tables
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FhirResource" ENABLE ROW LEVEL SECURITY;

-- Application-defined GUC function
CREATE OR REPLACE FUNCTION app.get_current_org() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.current_org_id', true), '')::uuid
$$;

-- Policies for datasets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'datasets_rls_select'
  ) THEN
    CREATE POLICY datasets_rls_select ON datasets
      FOR SELECT USING (organization_id = app.get_current_org());
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'datasets_rls_mod'
  ) THEN
    CREATE POLICY datasets_rls_mod ON datasets
      FOR INSERT WITH CHECK (organization_id = app.get_current_org());
    CREATE POLICY datasets_rls_update ON datasets
      FOR UPDATE USING (organization_id = app.get_current_org()) WITH CHECK (organization_id = app.get_current_org());
    CREATE POLICY datasets_rls_delete ON datasets
      FOR DELETE USING (organization_id = app.get_current_org());
  END IF;
END$$;

-- Policies for FhirResource
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'fhirresource_rls_select'
  ) THEN
    CREATE POLICY fhirresource_rls_select ON "FhirResource"
      FOR SELECT USING (organization_id = app.get_current_org());
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'fhirresource_rls_mod'
  ) THEN
    CREATE POLICY fhirresource_rls_mod ON "FhirResource"
      FOR INSERT WITH CHECK (organization_id = app.get_current_org());
    CREATE POLICY fhirresource_rls_update ON "FhirResource"
      FOR UPDATE USING (organization_id = app.get_current_org()) WITH CHECK (organization_id = app.get_current_org());
    CREATE POLICY fhirresource_rls_delete ON "FhirResource"
      FOR DELETE USING (organization_id = app.get_current_org());
  END IF;
END$$;
