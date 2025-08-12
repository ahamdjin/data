-- Ensure a unique constraint for dedupe per org when idempotency_key is provided
CREATE UNIQUE INDEX IF NOT EXISTS uniq_jobs_org_idem
ON jobs (organization_id, idempotency_key)
WHERE idempotency_key IS NOT NULL;
