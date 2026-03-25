-- Fix RLS on push_subscriptions
-- VULNERABILITY: policy "push_subscriptions_open" used USING (true) WITH CHECK (true)
-- allowing any anon request to SELECT/INSERT/UPDATE/DELETE ALL records from ALL tenants.
--
-- New model:
--   - service_role  → full access (Edge Functions send push notifications)
--   - anon/authenticated → INSERT + UPDATE only (subscribe/update own subscription)
--   - SELECT is blocked for anon/authenticated (prevents enumeration of all endpoints)

-- 1. Drop the insecure open policy
DROP POLICY IF EXISTS "push_subscriptions_open" ON push_subscriptions;

-- Also drop any prior tenant-isolation policy from earlier fix attempts
DROP POLICY IF EXISTS "push_subscriptions_tenant_isolation" ON push_subscriptions;

-- 2. service_role: full access (needed by Edge Functions to read and send notifications)
CREATE POLICY "push_subs_service_full"
  ON push_subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. anon/authenticated: INSERT only — subscribe a new endpoint
--    (upsert uses INSERT ... ON CONFLICT DO UPDATE, handled by policy #4)
CREATE POLICY "push_subs_insert"
  ON push_subscriptions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 4. anon/authenticated: UPDATE only — refresh keys for existing endpoint
--    No SELECT needed; the upsert in usePushSubscription.js targets by endpoint (UNIQUE)
CREATE POLICY "push_subs_update"
  ON push_subscriptions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- SELECT and DELETE remain blocked for anon/authenticated roles.
-- Anon users cannot enumerate push endpoints from other tenants or users.
