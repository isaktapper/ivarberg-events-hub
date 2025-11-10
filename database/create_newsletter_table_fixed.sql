-- Skapa newsletter_subscriptions tabellen
-- Exakt samma struktur som event_tips (som fungerar)
-- Kör denna fil EFTER drop_newsletter_table.sql

-- 1. Skapa tabellen
CREATE TABLE newsletter_subscriptions (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Index för bättre prestanda
CREATE INDEX idx_newsletter_subscriptions_email ON newsletter_subscriptions(email);
CREATE INDEX idx_newsletter_subscriptions_subscribed_at ON newsletter_subscriptions(subscribed_at);

-- 3. RLS för säkerhet
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Policy för att alla kan skapa prenumerationer
-- EXAKT samma struktur som event_tips
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

-- 5. Policy för att bara admins kan läsa prenumerationer
CREATE POLICY "Only admins can read subscriptions" ON newsletter_subscriptions
  FOR SELECT USING (false); -- Ändra till admin-check senare

-- 6. Grant permissions - EXAKT samma som event_tips
GRANT SELECT, INSERT, UPDATE ON newsletter_subscriptions TO anon;
GRANT USAGE ON SEQUENCE newsletter_subscriptions_id_seq TO anon;

-- 7. Trigger för updated_at (samma som event_tips)
CREATE TRIGGER update_newsletter_subscriptions_updated_at 
  BEFORE UPDATE ON newsletter_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

