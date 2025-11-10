-- ALTERNATIV FIX - Om den vanliga fixen inte fungerar
-- Kör denna fil i Supabase SQL Editor

-- 1. Ta bort ALLA policies
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Only admins can read subscriptions" ON newsletter_subscriptions;

-- 2. Temporärt inaktivera RLS för att testa
-- ALTER TABLE newsletter_subscriptions DISABLE ROW LEVEL SECURITY;

-- 3. Eller skapa en policy utan explicit TO-klausul
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscriptions
  FOR INSERT 
  WITH CHECK (true);

-- 4. Om ovanstående fungerar, aktivera RLS igen och skapa policy med explicit roles
-- ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscriptions;
-- CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscriptions
--   FOR INSERT 
--   TO anon, authenticated
--   WITH CHECK (true);

