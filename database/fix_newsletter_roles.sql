-- FIX: Ändra policy från {public} till {anon, authenticated}
-- Problemet är att policyn är konfigurerad för {public} men Supabase använder {anon, authenticated}

-- 1. Ta bort befintlig policy
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscriptions;

-- 2. Skapa policy med explicit roller för anon och authenticated
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscriptions
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- 3. Verifiera att det fungerade (kör denna query efteråt)
-- SELECT schemaname, tablename, policyname, roles, cmd, with_check
-- FROM pg_policies 
-- WHERE tablename = 'newsletter_subscriptions';

