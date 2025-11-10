-- Fix RLS policy för newsletter_subscriptions tabellen
-- Kör denna fil om du redan har skapat tabellen men får RLS-fel

-- Ta bort befintlig policy om den finns
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Only admins can read subscriptions" ON newsletter_subscriptions;

-- Skapa policy för att alla kan skapa prenumerationer (samma struktur som event_tips)
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

-- Policy för att bara admins kan läsa prenumerationer
CREATE POLICY "Only admins can read subscriptions" ON newsletter_subscriptions
  FOR SELECT USING (false); -- Ändra till admin-check senare

-- Grant permissions för att anon-användare kan skapa prenumerationer
-- Detta är kritiskt - utan detta kommer 401 Unauthorized
GRANT INSERT ON newsletter_subscriptions TO anon;
GRANT INSERT ON newsletter_subscriptions TO authenticated;
GRANT USAGE ON SEQUENCE newsletter_subscriptions_id_seq TO anon;
GRANT USAGE ON SEQUENCE newsletter_subscriptions_id_seq TO authenticated;

