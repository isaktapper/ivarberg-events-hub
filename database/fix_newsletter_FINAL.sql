-- FINAL FIX - Kör denna fil i Supabase SQL Editor
-- Denna fil fixar ALLT och verifierar att det fungerar

-- 1. Ta bort ALLA policies
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Only admins can read subscriptions" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Admins can read subscriptions" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Admins can update subscriptions" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Admins can delete subscriptions" ON newsletter_subscriptions;

-- 2. Ta bort alla befintliga grants (för att börja om)
REVOKE ALL ON newsletter_subscriptions FROM anon;
REVOKE ALL ON newsletter_subscriptions FROM authenticated;
REVOKE ALL ON SEQUENCE newsletter_subscriptions_id_seq FROM anon;
REVOKE ALL ON SEQUENCE newsletter_subscriptions_id_seq FROM authenticated;

-- 3. Säkerställ att RLS är aktiverat
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Skapa policy - EXAKT som event_tips
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

-- 5. Skapa SELECT policy
CREATE POLICY "Only admins can read subscriptions" ON newsletter_subscriptions
  FOR SELECT USING (false);

-- 6. KRITISKT: Ge rättigheter - EXAKT som event_tips
GRANT SELECT, INSERT, UPDATE ON newsletter_subscriptions TO anon;
GRANT USAGE ON SEQUENCE newsletter_subscriptions_id_seq TO anon;

-- 7. Verifiera att det fungerade (kör dessa queries efteråt)
-- SELECT schemaname, tablename, policyname, roles, cmd, with_check
-- FROM pg_policies 
-- WHERE tablename = 'newsletter_subscriptions';
--
-- SELECT grantee, privilege_type 
-- FROM information_schema.table_privileges 
-- WHERE table_name = 'newsletter_subscriptions' 
-- AND grantee = 'anon';

