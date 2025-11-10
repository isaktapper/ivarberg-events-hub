-- ENKEL DIAGNOSTIK - Kör denna och dela ALLA resultat

-- 1. NEWSLETTER: Kontrollera policies
SELECT policyname, roles, cmd, with_check
FROM pg_policies 
WHERE tablename = 'newsletter_subscriptions';

-- 2. EVENT_TIPS: Kontrollera policies
SELECT policyname, roles, cmd, with_check
FROM pg_policies 
WHERE tablename = 'event_tips';

-- 3. NEWSLETTER: Kontrollera table grants för anon
SELECT privilege_type
FROM information_schema.table_privileges 
WHERE table_name = 'newsletter_subscriptions'
AND grantee = 'anon'
ORDER BY privilege_type;

-- 4. EVENT_TIPS: Kontrollera table grants för anon
SELECT privilege_type
FROM information_schema.table_privileges 
WHERE table_name = 'event_tips'
AND grantee = 'anon'
ORDER BY privilege_type;

