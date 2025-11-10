-- Komplett fix för newsletter_subscriptions RLS-problem
-- Kör denna fil i Supabase SQL Editor för att fixa alla problem

-- 1. Ta bort alla befintliga policies
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Only admins can read subscriptions" ON newsletter_subscriptions;

-- 2. Säkerställ att RLS är aktiverat
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Skapa policy för INSERT (samma struktur som event_tips som fungerar)
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscriptions
  FOR INSERT 
  WITH CHECK (true);

-- 4. Skapa policy för SELECT (bara admins kan läsa)
CREATE POLICY "Only admins can read subscriptions" ON newsletter_subscriptions
  FOR SELECT 
  USING (false);

-- 5. KRITISKT: Ge INSERT-rättigheter till anon och authenticated
-- Utan detta kommer du få 401 Unauthorized
GRANT INSERT ON newsletter_subscriptions TO anon;
GRANT INSERT ON newsletter_subscriptions TO authenticated;

-- 6. KRITISKT: Ge rättigheter att använda sekvensen (för auto-increment ID)
-- Kontrollera sekvensnamnet - kan vara newsletter_subscriptions_id_seq eller bara id_seq
GRANT USAGE ON SEQUENCE newsletter_subscriptions_id_seq TO anon;
GRANT USAGE ON SEQUENCE newsletter_subscriptions_id_seq TO authenticated;

-- Om ovanstående ger fel, prova detta istället (beroende på hur tabellen skapades):
-- GRANT USAGE, SELECT ON SEQUENCE newsletter_subscriptions_id_seq TO anon;
-- GRANT USAGE, SELECT ON SEQUENCE newsletter_subscriptions_id_seq TO authenticated;

-- 7. Verifiera att allt är korrekt (valfritt - kommentera bort om du får fel)
-- SELECT * FROM pg_policies WHERE tablename = 'newsletter_subscriptions';
-- SELECT * FROM information_schema.table_privileges WHERE table_name = 'newsletter_subscriptions';

