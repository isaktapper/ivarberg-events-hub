# PostHog Events Dokumentation

Detta dokument beskriver alla PostHog events som är implementerade i ivarberg.nu och vilken data som samlas in för varje event.

## Översikt

Vi använder PostHog för att spåra användarinteraktioner och beteenden på plattformen. Alla events samlar in relevant kontextuell data för att förstå hur användare interagerar med evenemangskalendern.

---

## 1. `search_suggestion_clicked`

**Vad mäter vi:** När en användare klickar på ett förslag i sökautocomplete-dropdownen.

**Var:** `src/components/Hero.tsx` (rad 198)

**Data som samlas in:**
- `search_term` (string) - Den aktuella söktermen som användaren skrev
- `suggestion_type` (string) - Typ av förslag: `'category'`, `'venue'`, eller `'event'`
- `suggestion_label` (string) - Texten på det klickade förslaget
- `suggestion_count` (number, optional) - Antal evenemang för detta förslag (endast för kategorier och platser)

**Användningsfall:** Förstå vilka typer av sökningar användare gör och vilka förslag som är mest populära.

---

## 2. `search_performed`

**Vad mäter vi:** När en användare utför en sökning (antingen via "Visa alla"-knappen eller formulärsubmit).

**Var:** `src/components/Hero.tsx` (rad 229 och 495)

**Data som samlas in:**
- `search_term` (string) - Söktermen som användaren sökte på
- `results_count` (number) - Antal resultat som hittades för söktermen
- `search_method` (string) - Hur sökningen utfördes: `'show_all_button'` eller `'form_submit'`

**Användningsfall:** Analysera sökmönster, populära söktermer, och hur många resultat användare generellt får.

---

## 3. `quick_filter_clicked`

**Vad mäter vi:** När en användare klickar på ett snabbfilter (t.ex. "Idag", "I helgen", "Denna vecka", "Till jul").

**Var:** `src/components/Hero.tsx` (rad 341)

**Data som samlas in:**
- `filter_id` (string) - ID för filtret: `'today'`, `'weekend'`, `'this-week'`, eller `'christmas'`
- `filter_label` (string) - Visningsnamnet på filtret (t.ex. "Idag", "I helgen")
- `filter_type` (string) - Typ av filter: `'date'` eller `'category'`

**Användningsfall:** Förstå vilka snabbfilter som är mest populära och hur användare navigerar genom tidsbaserade evenemang.

---

## 4. `tip_submitted`

**Vad mäter vi:** När en användare framgångsrikt skickar in ett evenemangstips via formuläret.

**Var:** `src/pages/Tips.tsx` (rad 63)

**Data som samlas in:**
- `categories` (array) - Array med alla kategorier som valdes för evenemanget
- `categories_count` (number) - Antal kategorier som valdes
- `has_image` (boolean) - Om användaren angav en bild-URL
- `has_website` (boolean) - Om användaren angav en hemsida/länk
- `tip_id` (string) - Det unika ID:t för det inskickade tipset

**Användningsfall:** Analysera kvaliteten på inskickade tips, vilka kategorier som är populärast att tipsa om, och hur kompletta tipsen är.

---

## 5. `event_viewed`

**Vad mäter vi:** När en användare besöker en evenemangsdetaljsida.

**Var:** `src/pages/EventDetail.tsx` (rad 87)

**Data som samlas in:**
- `event_id` (string) - Det unika ID:t för evenemanget
- `event_title` (string) - Titeln på evenemanget
- `category` (string) - Huvudkategorin för evenemanget
- `all_categories` (array) - Alla kategorier som evenemanget tillhör
- `venue_name` (string, optional) - Namnet på platsen/venuen
- `is_featured` (boolean) - Om evenemanget är marknadsfört/featured
- `is_past` (boolean) - Om evenemanget redan har passerat
- `organizer_name` (string, optional) - Namnet på arrangören

**Användningsfall:** Förstå vilka evenemang som är mest populära, vilka kategorier som genererar mest visningar, och om featured-evenemang får fler visningar.

---

## 6. `organizer_cta_clicked`

**Vad mäter vi:** När en användare klickar på "Gå till arrangör"-knappen på en evenemangsdetaljsida.

**Var:** `src/pages/EventDetail.tsx` (rad 575)

**Data som samlas in:**
- `event_id` (string) - Det unika ID:t för evenemanget
- `event_title` (string) - Titeln på evenemanget
- `organizer_name` (string, optional) - Namnet på arrangören
- `organizer_url` (string) - URL:en som användaren skickas till
- `url_type` (string) - Typ av URL: `'event_website'` eller `'organizer_event_url'`

**Användningsfall:** Mäta konvertering från evenemangsvisning till arrangörswebbplats, och förstå vilka arrangörer som genererar mest klick.

---

## 7. `category_multiselect_clicked`

**Vad mäter vi:** När en användare väljer eller avväljer en kategori i kategorimultiväljaren (på tipsformuläret).

**Var:** `src/components/CategoryMultiSelect.tsx` (rad 49, 59, 71)

**Data som samlas in:**
- `category` (string) - Kategorin som klickades på
- `action` (string) - Åtgärden: `'selected'` eller `'deselected'`
- `selected_categories_count` (number) - Totalt antal valda kategorier efter åtgärden
- `context` (string) - Kontexten där åtgärden skedde: `'form'`
- `removed_via` (string, optional) - Om kategorin togs bort via X-knappen: `'x_button'`

**Användningsfall:** Förstå hur användare väljer kategorier när de skickar in tips, och vilka kategorier som ofta väljs tillsammans.

---

## 8. `category_clicked`

**Vad mäter vi:** När en användare klickar på en kategori i kategoriscrollern (på huvudsidan).

**Var:** `src/components/CategoryScroller.tsx` (rad 39)

**Data som samlas in:**
- `category` (string) - Kategorin som klickades på
- `action` (string) - Åtgärden: `'selected'` eller `'deselected'`
- `selected_categories_count` (number) - Totalt antal valda kategorier efter åtgärden

**Användningsfall:** Analysera vilka kategorier som är mest populära, och hur användare filtrerar evenemang.

---

## 9. `location_filter_clicked`

**Vad mäter vi:** När en användare klickar på platsfiltret (för närvarande visar detta bara ett meddelande att funktionen kommer snart).

**Var:** `src/components/LocationFilter.tsx` (rad 30)

**Data som samlas in:**
- `selected_location` (string) - Den valda platsen när filtret klickades

**Användningsfall:** Förstå intresse för platsbaserad filtrering innan funktionen är implementerad.

---

## 10. `event_card_clicked`

**Vad mäter vi:** När en användare klickar på ett evenemangskort i evenemangslistan.

**Var:** `src/components/EventListItem.tsx` (rad 41)

**Data som samlas in:**
- `event_id` (string) - Det unika ID:t för evenemanget
- `event_title` (string) - Titeln på evenemanget
- `category` (string) - Huvudkategorin som visas på kortet
- `is_featured` (boolean) - Om evenemanget är marknadsfört/featured

**Användningsfall:** Analysera vilka evenemang som är mest attraktiva i listvyn, och om featured-evenemang får fler klick.

---

## Sammanfattning av datainsamling

### Användaridentifikation
PostHog identifierar automatiskt användare via cookies och sessioner. Inga personuppgifter (som e-post eller namn) skickas till PostHog från formulär.

### Event-frekvens
- **Hög frekvens:** `category_clicked`, `event_card_clicked`, `search_performed`
- **Medel frekvens:** `search_suggestion_clicked`, `quick_filter_clicked`, `event_viewed`
- **Låg frekvens:** `tip_submitted`, `organizer_cta_clicked`, `category_multiselect_clicked`, `location_filter_clicked`

### Data som INTE samlas in
- Personuppgifter (e-post, namn, telefonnummer)
- Exakta adresser från användarinput
- Beskrivningar eller textinnehåll från evenemang
- Bild-URLs eller andra media-referenser

---

## Teknisk implementation

PostHog är konfigurerad i `src/main.tsx` med:
- API-nyckel från miljövariabler (`VITE_PUBLIC_POSTHOG_KEY`)
- API-host från miljövariabler (`VITE_PUBLIC_POSTHOG_HOST`)
- Standardinställningar med datum `"2025-05-24"`

Alla events använder `usePostHog()` hook från `posthog-js/react` för att säkerställa korrekt tracking även när PostHog inte är tillgängligt (via optional chaining `posthog?.capture()`).


