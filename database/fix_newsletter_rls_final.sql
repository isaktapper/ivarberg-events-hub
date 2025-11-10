-- FINAL FIX för newsletter_subscriptions RLS-problem
-- Kör denna fil i Supabase SQL Editor

-- 1. Ta bort ALLA befintliga policies för denna tabell
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Only admins can read subscriptions" ON newsletter_subscriptions;

-- 2. Kontrollera att RLS är aktiverat
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Skapa policy för INSERT - explicit för anon och authenticated
-- VIKTIGT: Använd USING istället för WITH CHECK om det inte fungerar
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscriptions
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- 4. Om ovanstående inte fungerar, prova denna variant istället:
-- CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscriptions
--   FOR INSERT 
--   WITH CHECK (true);

-- 5. Skapa policy för SELECT (bara admins kan läsa)
CREATE POLICY "Only admins can read subscriptions" ON newsletter_subscriptions
  FOR SELECT 
  USING (false);

-- 6. Verifiera policies (kör denna query för att se vilka policies som finns)
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'newsletter_subscriptions';

