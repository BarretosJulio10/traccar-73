-- Audit logs table with secure RLS
-- Tracks login, logout, and other security-relevant actions from the frontend.
--
-- Security model:
--   - anon/authenticated → INSERT only (client writes audit events)
--   - SELECT, UPDATE, DELETE → blocked for anon/authenticated
--   - service_role → full access (admin dashboards, reporting)
--
-- This prevents users from reading, tampering with, or deleting audit records.

CREATE TABLE IF NOT EXISTS audit_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text,
  email      text,
  action     text NOT NULL,
  details    jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id   ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action    ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop any previous open policy if this table was created manually
DROP POLICY IF EXISTS "audit_logs_open"          ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert"        ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_service_full"  ON audit_logs;

-- service_role: full access (admin/reporting)
CREATE POLICY "audit_logs_service_full"
  ON audit_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- anon/authenticated: INSERT only — write audit events, cannot read history
CREATE POLICY "audit_logs_insert"
  ON audit_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- SELECT, UPDATE, DELETE remain blocked for anon/authenticated.
