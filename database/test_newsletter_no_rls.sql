-- TEST: Inaktivera RLS tillfälligt för att testa om problemet är RLS
-- Kör denna fil för att testa om det fungerar utan RLS

-- 1. Inaktivera RLS
ALTER TABLE newsletter_subscriptions DISABLE ROW LEVEL SECURITY;

-- 2. Ge rättigheter
GRANT SELECT, INSERT, UPDATE ON newsletter_subscriptions TO anon;
GRANT USAGE ON SEQUENCE newsletter_subscriptions_id_seq TO anon;

-- Om detta fungerar, är problemet RLS-policyn
-- Om detta INTE fungerar, är problemet något annat (t.ex. Supabase API keys)

