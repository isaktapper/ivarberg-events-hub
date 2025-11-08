-- Tabell för nyhetsbrev-prenumerationer
CREATE TABLE newsletter_subscriptions (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index för bättre prestanda
CREATE INDEX idx_newsletter_subscriptions_email ON newsletter_subscriptions(email);
CREATE INDEX idx_newsletter_subscriptions_subscribed_at ON newsletter_subscriptions(subscribed_at);

-- RLS för säkerhet
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy för att alla kan skapa prenumerationer
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

-- Policy för att bara admins kan läsa prenumerationer
CREATE POLICY "Only admins can read subscriptions" ON newsletter_subscriptions
  FOR SELECT USING (false); -- Ändra till admin-check senare

-- Grant permissions för att anon och authenticated användare kan skapa prenumerationer
GRANT INSERT ON newsletter_subscriptions TO anon;
GRANT INSERT ON newsletter_subscriptions TO authenticated;
GRANT USAGE ON SEQUENCE newsletter_subscriptions_id_seq TO anon;
GRANT USAGE ON SEQUENCE newsletter_subscriptions_id_seq TO authenticated;

-- Trigger för updated_at
CREATE TRIGGER update_newsletter_subscriptions_updated_at 
  BEFORE UPDATE ON newsletter_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

