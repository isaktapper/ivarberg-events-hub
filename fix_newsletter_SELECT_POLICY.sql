-- FIX: Ta bort SELECT-policyn som blockerar INSERT
-- Problemet: SELECT USING (false) blockerar ALL läsning, även intern Postgres-verifiering vid INSERT
-- Lösning: Ta bort SELECT-policyn helt - utan policy kan ingen läsa via API

-- 1. Ta bort SELECT-policyn som blockerar allt
DROP POLICY IF EXISTS "Only admins can read subscriptions" ON newsletter_subscriptions;

-- 2. Skapa INGEN ny SELECT-policy
-- Utan SELECT-policy:
-- - anon-användare kan INTE läsa via Supabase API ✓
-- - authenticated-användare kan INTE läsa via Supabase API ✓
-- - INSERT fungerar eftersom Postgres inte blockeras ✓
-- - Endast direkt SQL-access (admin) kan läsa ✓

-- Om du senare vill att authenticated users ska kunna läsa, lägg till:
-- CREATE POLICY "Authenticated can read subscriptions" ON newsletter_subscriptions
--   FOR SELECT 
--   TO authenticated
--   USING (true);

