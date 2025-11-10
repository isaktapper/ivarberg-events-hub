-- DIAGNOSTIK - Kör denna fil för att se exakt vad som är fel
-- Kopiera HELA resultatet och visa för mig

-- 1. Kontrollera att tabellen finns och i vilket schema
SELECT schemaname, tablename 
FROM pg_tables 
WHERE tablename = 'newsletter_subscriptions';

-- 2. Kontrollera RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'newsletter_subscriptions';

-- 3. Kontrollera ALLA policies för newsletter_subscriptions
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'newsletter_subscriptions'
ORDER BY policyname;

-- 4. Kontrollera ALLA policies för event_tips (som fungerar)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'event_tips'
ORDER BY policyname;

-- 5. Kontrollera grants för newsletter_subscriptions
SELECT grantee, privilege_type, is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'newsletter_subscriptions'
ORDER BY grantee, privilege_type;

-- 6. Kontrollera grants för event_tips (som fungerar)
SELECT grantee, privilege_type, is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'event_tips'
ORDER BY grantee, privilege_type;

-- 7. Kontrollera sekvensen för newsletter_subscriptions
SELECT sequence_name, data_type, start_value, increment
FROM information_schema.sequences
WHERE sequence_name LIKE '%newsletter%';

-- 8. Kontrollera sekvensen för event_tips
SELECT sequence_name, data_type, start_value, increment
FROM information_schema.sequences
WHERE sequence_name LIKE '%event_tips%';

-- 9. Kontrollera sequence privileges för newsletter_subscriptions
SELECT grantor, grantee, privilege_type
FROM information_schema.usage_privileges
WHERE object_name LIKE '%newsletter%'
ORDER BY grantee;

-- 10. Kontrollera sequence privileges för event_tips
SELECT grantor, grantee, privilege_type
FROM information_schema.usage_privileges
WHERE object_name LIKE '%event_tips%'
ORDER BY grantee;

