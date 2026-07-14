# Plan: AI-sök & landningssidor (GEO)

**Mål:** Bli citerad med länk i Googles AI-översikt för frågor som "händer i varberg idag",
bli synlig i ChatGPT/Perplexity, och på sikt ranka över de etablerade evenemangskalendrarna.

**Grundprincip: rör inte React-appen.** Allt nytt byggs som Vercel-funktioner vid sidan om,
med samma mönster som redan finns i `api/sitemap.xml.ts`. Varje steg kan stängas av genom
att ta bort en rewrite-rad i `vercel.json` — appen påverkas aldrig.

## Bakgrund (diagnos 2026-07-14)

- Sajten är en klientrenderad SPA: rå HTML är ~2 kB med tom `<div id="root">`.
  Googlebot renderar JS (därför rankar vi organiskt), men AI-översiktens citeringslager
  och AI-crawlers (GPTBot, PerplexityBot, ClaudeBot) kör inte JS → de ser en tom sida.
  Det är därför vi omnämns i AI-svaret men inte citeras med länk.
- Schema-komponenterna (FAQSchema, LocalBusinessSchema, Event-schema i EventDetail)
  injiceras via JS och syns aldrig i rå HTML.
- Styrkor som redan finns: robots.txt tillåter alla AI-crawlers, `llms.txt` finns
  (det saknar konkurrenterna), dynamisk sitemap med riktiga lastmod-datum.
- Ingen av konkurrenterna har Event-schema i rå HTML eller en sida som specifikt
  svarar på "idag"-frågan. Fönstret står öppet.

---

## Fas 1 — Pilot: serverrenderad `/idag`-sida

**En ny fil + en rewrite-rad. Inga ändringar i React-koden.**

### `api/landing.ts` (ny Vercel-funktion)

Hämtar dagens publicerade events från Supabase REST (samma anrop som sitemapen:
`status=eq.published`, `date_time` inom dagens datum, select på
`event_id, name, date_time, venue_name, location, price, categories, description, image_url, featured, organizer_id`)
och returnerar en komplett HTML-sida:

- **Title:** `Vad händer i Varberg idag, måndag 14 juli? | ivarberg.nu` (dynamiskt datum)
- **Meta description:** dynamisk — antal event + 2–3 eventnamn
- **H1:** `Vad händer i Varberg idag?`
- **Svarsblock (134–167 ord)** direkt under H1: dagens datum, antal event och de
  3 hetaste aktiviteterna med namn, tid och plats. Mallbaserad v1 byggd av eventdata
  (featured först, därefter spridning på kategori/venue). Konkret och hjälpsam —
  namnger riktiga event, ingen generisk fluff.
- **"Dagens 3 hetaste"** — kort sektion med en mening per event.
- **Komplett lista** över dagens alla event (tid, namn, plats, pris, kategori),
  varje rad länkad till `/event/{event_id}` i appen.
- **JSON-LD i rå HTML:** `ItemList` + `Event` per event (`startDate`, `location`
  med adress, `organizer`, `offers` när pris finns), `WebPage`, `BreadcrumbList`.
- **Korslänkar** till `/imorgon`, `/i-helgen`, `/i-veckan` (fas 2) och startsidan.
- Enkel inline-CSS i ivarbergs designspråk (färger/typografi från
  `ivarberg-design-system.json`).

**Cache:** `s-maxage=3600, stale-while-revalidate=86400` — sidan är alltid dagsfärsk
utan cron eller rebuilds, eftersom den renderas per request.

**Edge case:** 0 event idag → visa närmaste kommande dagar + ärlig text
("Inga evenemang idag — här är veckans höjdpunkter").

### `vercel.json`

Rewrite `/idag` → `/api/landing?period=idag`, placerad **före** catch-all-rewriten.

### Verifiering innan produktion

1. Testa i Vercel preview-deploy.
2. `curl https://<preview>/idag` — allt innehåll ska synas utan JS.
3. Google Rich Results Test på Event-scheman.
4. Rollback vid problem = ta bort rewrite-raden.

---

## Fas 2 — Klona till `/imorgon`, `/i-helgen`, `/i-veckan`

Samma funktion; `period`-parametern styr datumintervall, rubriker och texter:

| URL | Intervall | H1 |
|---|---|---|
| `/imorgon` | imorgon 00:00–23:59 | Vad händer i Varberg imorgon? |
| `/i-helgen` | fredag 15:00 – söndag 23:59 | Vad händer i Varberg i helgen? |
| `/i-veckan` | måndag–söndag innevarande vecka | Vad händer i Varberg i veckan? |

- Unik title, H1 och ingress per sida; korslänkning mellan alla fyra.
- **Bygg inte** en sida per veckodag ("på onsdag" etc.) — nära noll sökvolym och
  sju nästan identiska sidor blir tunt/duplicerat innehåll som skadar mer än det hjälper.
  `/i-veckan` täcker behovet.

---

## Fas 3 — Integrera med resten av sajten

- Lägg in de fyra sidorna i `api/sitemap.xml.ts` (`changefreq: daily`, `priority: 0.9`).
- Uppdatera `public/llms.txt` med de nya sidorna under "Viktiga sidor".
- Länka till sidorna från SPA:ns header/footer — enda (ofarliga) ändringen i React-appen.
- Begär indexering av de nya URL:erna i Google Search Console.

---

## Fas 4 — AI-genererad guide (uppgradering av ingressen)

När mallversionen rullar och indexeras:

- **Vercel cron** (en gång per dygn, tidig morgon) genererar guide-texten per period
  via OpenAI API utifrån periodens faktiska eventdata.
- Sparas i ny Supabase-tabell `landing_copy (period, date, copy, created_at)`.
- `api/landing.ts` läser dagens copy om den finns; annars mall-fallback (sidan är
  aldrig beroende av att cron lyckats).
- **Kvalitetskrav på prompten:** namnge riktiga event med tid/plats, max ~150 ord,
  skriv för en Varbergsbo som undrar vad hen ska hitta på — förbjud generiska fraser
  ("något för hela familjen", "en hel del spännande aktiviteter").
- Modell: `gpt-5-mini` räcker väl för daglig kort copy (billig, snabb). Uppgradera
  till `gpt-5` endast om texterna inte håller kvaliteten.
- Ny miljövariabel i Vercel: `OPENAI_API_KEY` (används bara server-side i cron-funktionen,
  exponeras aldrig mot klienten).

---

## Fas 5 — Senare / större (separat beslut)

- **Eventsidornas synlighet:** prerendering eller SSR för `/event/`-sidorna så att
  varje event får unik title/meta + Event-schema i rå HTML. Större ingrepp i bygget —
  planeras separat, påverkas inte av fas 1–4.
- **Entitetsbygge:** omnämnanden i lokalpress, Wikidata-post, YouTube/Reddit-närvaro,
  länkar från lokala aktörer. Omnämnanden korrelerar ~3x starkare med AI-citeringar
  än backlinks.

---

## Mätning

- **Google Search Console:** impressions/klick för de nya URL:erna och frågor som
  innehåller "idag", "i helgen", "i veckan".
- **Manuell koll** av AI-översikten för målfrågorna efter 2–4 veckor.
- **Vercel-loggar:** träffar från GPTBot/PerplexityBot/ClaudeBot på de nya sidorna.

## Risker & skydd

| Risk | Skydd |
|---|---|
| Något går sönder i appen | Ingen SPA-kod ändras (utom valfri footer-länk); rollback = ta bort rewrite |
| Rewrite krockar med catch-all | Nya rutter läggs före catch-all; testas i preview-deploy |
| Cron/AI-copy fallerar | Mall-fallback gör att sidan alltid fungerar |
| Nya hemligheter exponeras | Nej — samma Supabase anon key som redan används publikt |

## Uppskattad insats

- Fas 1: ~en dags arbete inkl. test
- Fas 2–3: någon timme vardera
- Fas 4: halv dag när fas 1–3 är verifierade
