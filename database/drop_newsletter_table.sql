-- Ta bort newsletter_subscriptions tabellen och alla policies
-- Kör denna fil först i Supabase SQL Editor

-- 1. Ta bort alla policies
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Only admins can read subscriptions" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Admins can read subscriptions" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Admins can update subscriptions" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Admins can delete subscriptions" ON newsletter_subscriptions;

-- 2. Ta bort trigger om den finns
DROP TRIGGER IF EXISTS update_newsletter_subscriptions_updated_at ON newsletter_subscriptions;

-- 3. Ta bort tabellen (detta tar också bort alla index och constraints)
DROP TABLE IF EXISTS newsletter_subscriptions CASCADE;

