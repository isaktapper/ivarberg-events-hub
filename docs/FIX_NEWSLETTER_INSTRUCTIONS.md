# Fix för Newsletter RLS-problem

Om du får **401 Unauthorized** eller **RLS policy violation** när du försöker prenumerera på nyhetsbrevet, följ dessa steg:

## Steg 1: Kör SQL-filen i Supabase

1. Öppna Supabase Dashboard
2. Gå till **SQL Editor**
3. Kopiera och klistra in hela innehållet från `fix_newsletter_rls_complete.sql`
4. Klicka på **Run** eller tryck `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

## Steg 2: Verifiera att det fungerade

Efter att du kört SQL-filen, kör denna query för att kontrollera:

```sql
-- Kontrollera att policyn finns
SELECT * FROM pg_policies WHERE tablename = 'newsletter_subscriptions';

-- Kontrollera att rättigheter finns
SELECT grantee, privilege_type 
FROM information_schema.table_privileges 
WHERE table_name = 'newsletter_subscriptions' 
AND grantee IN ('anon', 'authenticated');
```

Du bör se:
- En policy med namnet "Anyone can subscribe to newsletter"
- INSERT-rättigheter för både `anon` och `authenticated`

## Steg 3: Om det fortfarande inte fungerar

Om du fortfarande får fel, kör dessa kommandon en i taget:

```sql
-- 1. Ta bort alla policies
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Only admins can read subscriptions" ON newsletter_subscriptions;

-- 2. Skapa policy igen
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

-- 3. Ge rättigheter (kör varje rad separat)
GRANT INSERT ON newsletter_subscriptions TO anon;
GRANT INSERT ON newsletter_subscriptions TO authenticated;
GRANT USAGE ON SEQUENCE newsletter_subscriptions_id_seq TO anon;
GRANT USAGE ON SEQUENCE newsletter_subscriptions_id_seq TO authenticated;
```

## Viktigt

- **401 Unauthorized** = GRANT-satserna har inte körts
- **RLS policy violation** = Policyn är felaktig eller saknas

Båda problemen löses genom att köra `fix_newsletter_rls_complete.sql`.

