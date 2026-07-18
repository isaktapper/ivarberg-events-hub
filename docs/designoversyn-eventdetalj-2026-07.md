**Policynotis:** Detta dokument innehåller organisationsnamn (goteborg.se/Göteborgs Stad, Stockholms stad, Kulturhuset Stadsteatern, Visit Stockholm, DICE, Luma, Eventbrite, Fever, Strömma Farmlodge, Varbergs kommun m.fl.) — att inkludera organisationsnamn är utanför organisationens policy. Namnen behålls i dokumentet eftersom underlaget och uppdraget kräver dem.

---

# Designöversyn ivarberg.nu — eventdetaljsidan & färgsystem (juli 2026)

Detta dokument är beslutsunderlaget för omdesignen av eventdetaljsidan (mobil) och sajtens färgsystem. Det bygger på: kod-audit av repot, heuristisk kritik av tre mobilskärmdumpar, teardowns av goteborg.se och Stockholms stads designspråk, tre layoutförslag, två färgriktningar samt en oberoende motkritik. Inget är ändrat i koden ännu.

---

## 1. Diagnos — varför sidan känns "klumpig och lite tråkig"

### 1.1 Primär-CTA:n ligger 2,5–3 skärmhöjder ner (KRITISKT)

"Gå till arrangör" (EventDetail.tsx:633–663) kommer efter hela beskrivningen. Sidans enda konvertering är ett knapptryck, och knappen ligger under brödtexten. Grovt mätt från skärmdumparna: header + brödsmulor + pillerrad ≈ 0,5 skärm, hero-bild ≈ 0,6, kategori + titel + datum/plats ≈ 0,7, beskrivning ≈ 1+ → CTA:n nås efter ~3 svep. Detta är den enskilt största orsaken till "klumpig"-känslan: sidan känns lång utan att belöna scrollandet. Etiketten är dessutom vag — "Gå till arrangör" säger inte om det är biljetter, hemsida eller något annat.

### 1.2 Första viewporten svarar inte på någon fråga (KRITISKT)

Ovanför bilden ligger ~430 px ren krom: header, brödsmulor på TVÅ rader (Breadcrumbs.tsx:48 radbryter för att hela eventtiteln upprepas), Tillbaka/Dela-piller. En förstagångsbesökare ser logotyp, navigationsskräp och en bit av en affisch — varken titel, datum, plats eller handling. Dessutom: tre redundanta vägar bakåt (brödsmulor, Tillbaka-piller, webbläsarens back) och noll vägar framåt i viewport 1.

### 1.3 Interaktiva element är nästan osynliga

Tillbaka, Dela, kalender- och kartnål-pillsen har `rgba(255,255,255,0.25)`-bakgrund på beige (EventDetail.tsx:344, :473, :515) — långt under WCAG:s 3:1 för UI-komponenter. Dagens blå `#4A90E2` ger 2,92:1 mot beige (underkänt) och 3,29:1 med vit text (underkänt för normal text). Ikon-only-knapparna saknar etikett: en 75-åring gissar inte att "kalender med plus" betyder "lägg i min kalender". Glas-pill-stilen är dessutom copy-pastad fem gånger i EventDetail med 7 JS-hoverhandlers som gör noll på touch (80 % av trafiken).

### 1.4 Typografin skriker i alla register samtidigt

H1 är 30 px, metarader 18 px, brödsmulor stora, karusellrubriken (24 px, SimilarEventsCarousel.tsx:99) är större än sidans egen H2 "Om evenemanget" (20 px) — omvänd hierarki. När allt är stort finns ingen hierarki; storlek är enda hierarkiverktyget. Stor **brödtext** för äldre läsare är rätt beslut — stor **krom** (brödsmulor, metarader, knappetiketter) är bara spill. Ingen typskala finns definierad; allt är ad hoc per komponent.

### 1.5 "Tråkig beige" — det är inte kulören, det är avsaknaden av värdekontrast

1. **Ett enda ytvärde överallt.** Bakgrund, kort, knappar och krom ligger i samma ljushet — sidan blir platt, inte lugn.
2. **Blått gör dubbelarbete.** Samma blå är kategoripiller (icke-interaktiv), länk, ikon och CTA. En accentfärg som inte är reserverad för handling förlorar både energi och betydelse.
3. **Konceptet uttrycks aldrig.** Hav/sand finns i paletten men aldrig i formen — ingen våg, ingen zon, bara hexkoder.
4. **Uniform rytm.** Likstora, mjuka, fristående block med samma padding och radie staplade på varandra = "klumpig".

### 1.6 Teknisk grund som gör varje ändring dyr

Sidans två mest använda färger finns inte som tokens: `#08075C` förekommer 280 gånger inline, `#4A90E2` 84 gånger, spritt över ~22 filer. Tokensystemet i `src/index.css:9–110` finns men förbigås av ~85 % av färgsättningen. Fyra olika blå samexisterar i samma flöde. Utan tokenisering är varje ny palett en 22-filers find-replace.

### 1.7 Svar på ägarens fråga: behövs kategori-pillren?

**Nej — inte som fristående pill-rad före titeln.** Din instinkt är rätt. "Scen" visas idag tre gånger på sidan (brödsmula, kategoripill, badge på relaterat kort), och pill-raden kostar en hel rad ovanför vecket. Men **informationen och navigeringsvärdet ska behållas**, i två billigare former:

- **Overline-text ovanför titeln:** "Scen · Varbergs Teater" — 13–14 px, medium vikt (INTE 12 px spärrad versal — det är den minst läsbara textformen för äldre ögon, och en för liten träffyta för att vara klickbar). Kulturhuset Stadsteatern-mönstret.
- **Klickbara filterchips längst ner** ("Mer inom Scen") efter Liknande evenemang — Eventbrite-mönstret. Det är där "vad mer finns?"-behovet uppstår, inte före titeln.

---

## 2. Tre layoutriktningar

Alla tre delar en gemensam kärna (breadcrumbs bort från mobil-UI, CTA upp, riktiga knappar, kategoripill → overline + bottenchips, karusell-bantning, H1 ner till 24 px). De skiljer sig i hur mycket visuell identitet som byts. Skeptikerns korrigeringar är inarbetade i samtliga.

### Gemensamma obligatoriska korrigeringar (gäller A, B och C)

1. **Breadcrumb-schemat sitter i den synliga komponenten.** `BreadcrumbList`-JSON-LD genereras i `src/components/Breadcrumbs.tsx` (rad 41–45, `<Helmet>`) i samma return som `<nav>`. Tas `<Breadcrumbs />` bort från EventDetail.tsx:330 försvinner schemat. Komponenten måste splittas i en schema-only-variant (~30 min). Verifiera rich results i Search Console efteråt. Ärlig riskbedömning: schema utan synligt UI är en gråzon hos Google — låg och sannolikt acceptabel risk, inte "noll SEO-kostnad" (Event-JSON-LD:n på EventDetail.tsx:319 bär event-rich-results och behålls orörd).
2. **"‹ Tillbaka" ska vara en riktig länk till `/evenemang`**, inte `history.back()`. Majoriteten av detaljsidesbesökarna landar direkt från Google — för dem är history.back en exit-knapp tillbaka till Google.
3. **CTA-etiketten villkoras.** "Biljetter & info hos arrangören" ljuger för gratisföreläsningar, sagostunder och friluftsgudstjänster (och prisdata finns inte längre som skydd). Default: **"Mer info hos arrangören"**; "Biljetter & info" endast när eventet bevisligen har biljettlänk. Mikrocopy "öppnas hos arrangören" under knappen.
4. **Karusellen får behålla EN synlig framåt-affordans.** Peek (1,15 kort) + swipe är basen, men swipe-only stänger ute äldre med darr eller noll swipevana. Behåll en diskret pil eller "Fler →"-textlänk. Prickar och "3 av 6" tas bort.
5. **Metarader: raden får vara tappbar, men den synliga etiketterade knappen i högerkant är den riktiga kontrollen** ("+ Kalender", "Vägbeskrivning" — med text, inte bara ikon). En textrad som i hemlighet är en knapp är samma affordansproblem som glaspillren, fast inverterat.
6. **Sticky-headern måste lösas** — den flyter in som kort mitt i läsytan (skärmdump 2). Hide-on-scroll-down/show-on-scroll-up, eller dölj den på eventdetalj-routen.
7. **Sticky botten-CTA byggs bakom en flagga**, med `safe-area-inset` (iOS: Safaris bottenlist + sticky bar = ~130 px staplade lister annars). "12–27 % uplift" kommer från e-handel, inte utgående arrangörslänkar — mät utklick i analytics, riv den om den skymmer.
8. **Desktop behöver ett definierat svar** innan bygge (kant-till-kant-bild, dold header och plattor är mobilbeslut). Ospecificerat = odesignat = upptäcks i implementationsveckan.

### Riktning A — "Informationsförst" (rekommenderad)

**Princip:** noll nya färger, noll nya fonter. Samma sand, samma navy, samma Poppins. Allt som ändras är ordning, storlek och affordans. Byggd för att fungera med den fulaste affischen i databasen — första intrycket hänger inte på bilder du inte kontrollerar.

```
┌──────────────── 390 px ────────────────┐
│ [Header]                                │
│ ‹ Alla evenemang            [Dela]     │  EN rad. Riktig länk + kantad knapp.
│ ┌─────────────────────────────────┐    │  Brödsmulor borta (schema kvar).
│ │      HERO-BILD 16:9             │    │
│ └─────────────────────────────────┘    │
│ Scen · Varbergs Teater                  │  overline 13px/500
│ Eventtitel som kan gå över              │  H1 24px/700, max 2 rader
│ två rader utan att skrika               │
│ ┌─────────────────────────────────┐    │
│ │ [kal] Sön 19 juli · 18:30       │    │  metablock: 16px, etiketterade
│ │                    [+ Kalender] │    │  knappar i högerkant
│ │ [pin] Varbergs Teater           │    │
│ │       Teatergatan 1  [Vägbeskr.]│    │
│ │  Fler datum: (25/7)(26/7)(29/7) │    │  fler-datum flyttad HIT
│ └─────────────────────────────────┘    │
│ ┌─────────────────────────────────┐    │
│ │   Mer info hos arrangören       │    │  PRIMÄR CTA, navy-fylld, 52px,
│ └─────────────────────────────────┘    │  SYNLIG I VIEWPORT 1
├─ vecket ────────────────────────────────┤
│ Om evenemanget   (H2 19px/700)          │
│ Brödtext 16px — OFÖRÄNDRAD, klipps      │
│ efter hel mening. Visa mer (textlänk)   │
│ [Arrangörskort: webb/mejl/tel]          │
├─────────────────────────────────────────┤
│ Liknande evenemang        Fler →        │
│ [kort 1        ][kort 2 (peek)…         │  1,15 kort + länk, inga prickar
│ Mer inom: (Scen) (Musik)                │  kategorichips hit
│ [Footer]                                │
└─────────────────────────────────────────┘
```

**Ändringslista (kodreferenser):**

| # | Ändring | Var |
|---|---|---|
| 1 | Breadcrumbs bort från mobil-UI, schema-split | EventDetail.tsx:330–334, Breadcrumbs.tsx:41–48 |
| 2 | Glas-pills → en `outline`-knappvariant (vit yta + 1 px navy-ram); 7 kopierade block + JS-hovers bort | EventDetail.tsx:338–387, 467–576; button.tsx |
| 3 | Kategoripill-rad bort → overline + bottenchips | EventDetail.tsx:399–428 |
| 4 | H1 30→24 px; H2 unifieras till 19 px inkl. karusellrubriken | EventDetail.tsx:443, 627; SimilarEventsCarousel.tsx:99 |
| 5 | Metablock med etiketterade knappar; deduplicera platsblocket (~40 dubblerade rader) | EventDetail.tsx:455–579 (grenar :495–538/:539–578) |
| 6 | CTA flyttas ovanför beskrivningen, navy-fylld (#08075C + vit = 15,6:1), villkorad etikett | EventDetail.tsx:633–663 |
| 7 | "Fler datum" flyttas upp till metablocket | EventDetail.tsx:584–622 |
| 8 | "Visa mer" → navy textlänk med chevron; klipp efter hel mening, inte mitt i insläppsinfon | EventDescription.tsx:53, 130 |
| 9 | Karusell: peek + "Fler →"; död `maxIndex`-state + resize-listener rensas | SimilarEventsCarousel.tsx:30–49, 197–240 |
| 10 | Brödtext och arrangörskort RÖRS EJ | index.css:171–173 |

**Byggtid:** förslagets egen skattning 3,5–5 dagar; realistiskt med feed-QA (event utan bild/venue/tid, passerade event, VoiceOver, zoom 200 %, två OS) **5–6 dagar**. **Risk:** löser "klumpig" men inte "tråkig" — måste därför uttryckligen ramas in som fas 1 av 2, och knappvarianten/metaraderna byggs mot tokens så att fas 2 (färg) blir en ren tokenändring. Det är den enda riktningen med en plan för att inte göra om jobbet.

### Riktning B — "Redaktionell/Magasin"

Kant-till-kant-bild, mörk navy-platta (#0B1B3A) med kicker + titel + metarader + CTA i ett färgblock, sand-läsyta under, tintade band-tiles med vänsterkant (goteborg.se-mönstret) för Fler datum/Arrangör. Ger mest "kuraterad produkt"-känsla.

**Styrkor att låna oavsett val:** tile-mönstret (3 px accent-vänsterkant + ljus tintbakgrund) för infoblock; "Fler tips inom Scen" som redaktionell röst; navy-plattan som **tillval** ovanpå A + Färg 1 (se §5).

**Svagheter (skeptikerns, bekräftade):** (a) Fraunces 800 är trendjakt — 2020-talets mest överanvända personlighets-serif; välj font på uppgiften (svenska tecken, långa titlar), inte på vad kultursajter använder just nu. (b) Brödtextbytet Poppins→Inter är dold hel-sajt-migrering (20+ filer, CLS-risk) som inte finns i estimatet. (c) Plattan satsar allt på okontrollerat feed-innehåll — skrikiga affischer mot mörk platta med tung display-serif kan bli "för mycket omslag", och B:s egen reträttplan (plattan i sand) är ett tyst erkännande att signaturgreppet är dekor. **Byggtid:** angivet 4–4,5 dagar; realistiskt **6–7** exkl. fontmigreringen. Bygg inte B som helhet — plocka russinen.

### Riktning C — "App-känsla"

Ingen site-header på detaljsidan, bild från y=0 kant-till-kant, Tillbaka/Dela som runda 44 px-ikoner på mörk scrim-gradient över bilden, Luma-metablock, sticky botten-bar, whileTap-feedback.

**Styrkor att låna oavsett val:** scrim-mönstret för Tillbaka/Dela (kontrast mot foto i stället för mot beige — löser knappsynligheten gratis); den designade fallback-heron (navy + vågform + kategori-ikon) för bildlösa event; `whileTap`-feedback som ENDA motion-tillägg; route-lösningen på sticky-header-problemet; `safe-area-inset`-medvetenheten.

**Svagheter:** (a) stagger-in-animation vid load är exakt "needless motion" — fördröjer lässtart och flyttar LCP bakåt (Core Web Vitals-försämring på sajtens viktigaste SEO-sidtyp). Stryks. (b) Header-hantering per route rör global layoutkod — regressionsrisk över övriga routes som inte syns i estimatet. (c) Kant-till-kant-hero förstorar varje ful feedaffisch. **Byggtid:** angivet 4,5–5,5 dagar; realistiskt **6–8**.

---

## 3. Färgriktningar

Förutsättning för ALLA riktningar: tokenisera först. Definiera valda färger i `src/index.css` + `tailwind.config.ts` och ersätt 280 × `#08075C` och 84 × `#4A90E2` — annars är varje palett ännu en find-replace i 22 filer. Radera även `ivarberg-design-system.json` (beskriver en annan sajt) och den trasiga `sunset.light`-tokenen.

### 3.1 Huvudspår: "Utveckla sand & hav" (rekommenderad)

Konceptet behålls: **sand är basen, havet är handlingen, navy blir en yta** (inte bara textfärg). Tre ingrepp: havsblått fördjupas från pastell till godkänd kontrast, EN varm signalfärg införs, och mörka "skymningshav"-zoner ger sidan värdeskala.

**Bas & ytor:**

| Token | Hex | Roll |
|---|---|---|
| `sand` | `#F5F1EA` | Sidbakgrund — **behåll befintlig hex** (förslagets #F7F2E9 är en osynlig ändring som bara skapar en övergångsperiod med två sander) |
| `sand-deep` | `#EFE7D8` | Sektionsband, alternerande ytor |
| `surface` | `#FFFFFF` | Kort |
| `navy-zone` | `#0B1B3A` | NY dramatisk yta: footer, ev. titelband på eventsidan, sticky CTA-bar |

**Text:**

| Token | Hex | Kontrast på sand | Roll |
|---|---|---|---|
| `ink` | `#10214B` | 14,0:1 | All rubrik/brödtext (ersätter #08075C — mjukare, fortfarande AAA) |
| `ink-soft` | `#4A566B` | 6,6:1 | Sekundär text: adresser, metadata |
| `ink-inverse` | `#F5F1EA` | 15,1:1 på navy-zone | Text på mörkt — sand på hav, konceptet i själva textfärgen |

**Handling ("havet") — reserverad ENBART för interaktion:**

| Token | Hex | Kontrast | Roll |
|---|---|---|---|
| `sea` | `#0F5AA6` | 6,2:1 på sand; vit på sea 6,9:1 | CTA, länkar, aktiva ikoner |
| `sea-dark` | `#0C4A8A` | vit 8,9:1 | Hover/pressed |
| `sea-light` | `#DCE9F7` | sea-dark på sea-light 7,2:1 | Sekundärknappars bakgrund, valda filter |
| `sea-lightest` | `#F0F6FC` | sea på denna 6,4:1 | Infoband ("Fler datum") |
| `sea-mist` | `#9DC8F5` | 9,8:1 på navy-zone | Länkar/ikoner på mörkt |

**Signal & semantik:**

| Token | Hex | Kontrast | Roll |
|---|---|---|---|
| `poppy-dark` | `#B84A14` | 4,7:1 på sand; vit på denna 5,2:1 | Varm accent: badge-text/ikon ("Idag!", "Marknadsfört") |
| `poppy-light` | `#FBE3D6` | — | Tonad badge-yta |
| `seaglass` | `#7FD1C8` | 9,6:1 på navy-zone | Accent endast i mörka zoner |
| `success` | `#1B6E4B` | 5,6:1 | Bekräftelser |
| `warning` | `#8A6400` på `#FBF0CE` | 4,7:1 | Varningar |
| `error` | `#B3261E` | 5,9:1 | Fel, "Inställt" |

Skeptikerns korrigering inarbetad: den klara `poppy #E2532F` (3,42:1 — endast grafik) definieras INTE. En "endast grafik"-regel utan lint-poliser bryts inom tre månader av en solo-dev; `poppy-dark` täcker behovet och klarar text.

Jämförelse med idag: `#4A90E2` på beige = 2,92:1 (underkänt även för UI-komponenter); vit på `#4A90E2` = 3,29:1 (underkänt för normal text). Varje textbärande kombination ovan klarar AA.

**Tre tekniker som ger liv utan nya kulörer:**
1. **Värdekontrast i zoner:** `navy-zone` (mörk) → `sand` (läsyta) → vita kort (lyft). Footer och ev. eventsidans titelband går mörka. Samma kulörer sajten redan äger, utspridda över hela ljushetsskalan.
2. **Accentdisciplin:** `sea` förekommer BARA på tryckbara saker. Dekor, rubriker och kategorier släpper blått helt — då återfår accenten energi.
3. **En återanvänd SVG-våg** i sand/navy-mötet (à la goteborg.se `c-hero--wave`) + tintade band som sektionsbakgrunder. Ingen gradient, inget brus.

**Kategorifärger — 12 kategorier, 6 hue-familjer, mörk-på-egen-ljus (Stockholms-modellen):**

| Familj | Text/ikon | Chipyta | Kontrast | Kategorier |
|---|---|---|---|---|
| Hav | `#0F4C81` | `#DCE9F7` | 7,2:1 | Musik · Konsert |
| Tång | `#0B5F50` | `#DCEEE6` | 6,3:1 | Natur & friluft · Sport |
| Tegel | `#A63A1B` | `#FBE3D6` | 5,3:1 | Scen & teater · Mat & dryck |
| Ljung | `#8A2455` | `#F9E2EC` | 7,0:1 | Nattliv · Festival |
| Solgul | `#7A5A00` | `#FBF0CE` | 5,6:1 | Barn & familj · Marknad |
| Flint | `#4C3A78` | `#ECE5F4` | 7,8:1 | Konst & kultur · Föreläsning |

Alla mörka varianter klarar 5,7–8,6:1 direkt på sand. Skillnad inom en familj görs med ikon, inte fler hues — men notera skeptikerns villkor: två kategorier som delar färg fungerar bara om ikonen faktiskt alltid visas bredvid. **Detta är fas 3, inte fas 1** — ~20 tokens + 12 mappningar som eventdetaljsidan inte behöver för att skeppa.

### 3.2 Modigare alternativ (bedömda, ej rekommenderade som grundton)

**"Granit & Vallmo"** (text byter till granit-bläck `#232B33` 12,9:1, djuphav `#0F5AA6` som handling, vallmo `#A2400D`/`#FCE3D9` som varm signal): kontrastmatten håller, men att byta ALL text från navy till granit är 280 förekomster och en hel-sajt-migrering för payoffen "vuxnare". Dyrast ändring, diffusast vinst. Vallmo-tokens kan däremot lyftas in i huvudspåret som alternativ till poppy.

**"Kattegatt efter solnedgång"** (navy-dominanta zoner `#0B1B3A`, solgul CTA `#FFB703` med navy-text 9,8:1, sjöglas `#7FD1C8` 9,6:1, korall `#FF6B4A` 6,1:1): matematiken är korrekt och gul-på-navy-CTA:n skulle lösa knappsynligheten med råge. Men grundtonen "konsertkväll" är fel för halva innehållet (sagostund på biblioteket 10:00, pensionärsträffar, friluftsgudstjänst) — en sajt för 15–85 har inte råd att välja 17-åringen i själva grundfärgen. Skrikiga feedaffischer blir dessutom MER skrikiga mot mörk botten, och två zoner betyder att varje komponent designas två gånger. **Rätt element, fel dosering:** navy som ZONER (footer, sticky bar, ev. titelband) är exakt vad huvudspårets `navy-zone` redan levererar. Hård regel om gult någonsin införs: solgul på ljus yta = 1,6:1 — gul existerar ALDRIG utanför mörka zoner.

---

## 4. Typografi — mobil typskala

Font: **Poppins behålls** (inget fontbyte i detta skede — det är hel-sajt-scope). Fixa buggen att Hero-H1 pekar på `Outfit` som aldrig laddas (Hero.tsx:216). Principen från både Göteborg och Stockholm: karaktär kommer från **vikt**, inte storlek — vikt hjälper äldre syn mer än storlek över ~28 px, och rubriker läses inte kontinuerligt.

| Element | Idag | Ny | Vikt/radavstånd |
|---|---|---|---|
| H1 (eventtitel) | 30 px | **24 px** | 700–800, lh 1.15, max 2 rader (clamp) |
| H2 ("Om evenemanget", "Liknande") | 20 resp. 24 px | **19 px** — unifierad, karusellen slutar övertrumfa sidans H2 | 700 |
| Metarader (datum, plats) | 18 px | **16 px** | 500 |
| Brödtext | 16 px | **16 px — RÖRS EJ** | 400, lh 1.6–1.7 |
| Sekundärmeta (adress) | 16 px opacity 0.6 | **15 px** i `ink-soft` (färg, inte opacity) | 400 |
| Overline (kategori · plats) | — (pill) | **13–14 px** | 500–600, måttlig spärrning, EJ 12 px versal |
| Knappar/CTA | 18 px | **16 px** | 600 |
| Chips/badges | 14 px | **13 px** | 500 |

Golv: inget textbärande element under 15 px förutom chips/overline (13–14 px, aldrig brödinformation). Vinst: ~60–90 px återvinns ovanför vecket utan att 75-åringen förlorar något — brödtext, metarader och zoom-beteende är orörda. Definiera skalan som tokens (clamp()-baserad) i index.css så den slutar vara ad hoc per komponent.

---

## 5. Rekommendation — vad som faktiskt ska byggas

**Layout A + färgspåret "Utveckla sand & hav", i två faser, med tre lån från C och ett tillval från B.** Skeptikerns slutsats, och den håller:

1. A är den enda layouten som inte satsar första intrycket på feedbilder du inte kontrollerar.
2. A fas 1 dödar "klumpig" (CTA i viewport 1, breadcrumbs bort, riktiga knappar, metablock). Färgspåret som fas 2 dödar "tråkig" (navy-zoner, tintband, accentdisciplin) — och eftersom fas 1 bygger mot tokens är fas 2 en tokenändring, inte en ombyggnad.
3. `navy-zone`-titelbandet ÄR B:s platta — som tillval i stället för fundament. Vill du ha mer temperament efter fas 2 finns B:s uttryck en tokenmappning bort, testbart mot riktiga event innan beslut. Du köper B:s uppsida utan B:s risk.
4. 75-åringen förlorar ingenting: orörd brödtext, ljus läsyta, etiketterade knappar, ingen mörkdominans.

Lån från C: scrim-mönstret för Tillbaka/Dela på bilden, fallback-heron för bildlösa event, `whileTap` som enda motion-tillägg.

### Quick wins denna vecka (fas 0, ~1,5–2 dagar, ingen designrisk)

| Åtgärd | Fil |
|---|---|
| Splitta Breadcrumbs i schema-only + UI; ta bort synligt UI på mobil; "‹ Alla evenemang" som riktig länk till /evenemang | Breadcrumbs.tsx:41–48, EventDetail.tsx:330–334 |
| En `outline`-knappvariant; ersätt 5 glas-pill-block + 7 JS-hoverhandlers med CSS-states | button.tsx, EventDetail.tsx:338–387, 467–576 |
| CTA-flytt ovanför beskrivningen + villkorad etikett + navy-fyllnad (allt ligger i ett `space-y-6`-block — lågrisk) | EventDetail.tsx:440, 633–663 |
| H1 30→24, H2 unifiera 19 px | EventDetail.tsx:443, 627; SimilarEventsCarousel.tsx:99 |
| Deduplicera platsblocket (~40 rader × 2) | EventDetail.tsx:495–578 |
| Rensa död kod: `maxIndex`+resize-listener, dubbla spinnrar, `.bg-texture`, Outfit-referensen, DEBUG-`getAllEvents()` | SimilarEventsCarousel.tsx:30–49; EventDetail.tsx:113/:727; index.css:189–192; Hero.tsx:216; Index.tsx:92–104 |

### Etapp 1 — resten av layout A (~3–4 dagar)

Metablock med etiketterade knappar, fler-datum-flytt, overline + bottenchips, "Visa mer"-fix, karusell-peek med "Fler →", scrim-knappar på bilden (C-lånet), sticky-header-lösning, fallback-hero. Bygg knappvariant och metablock mot tokens från dag ett.

### Etapp 2 — färg & temperament (~2–3 dagar)

Tokenisera paletten i §3.1 i index.css/tailwind.config; ersätt inline-hexen i EventDetail-flödet först, resterande ~20 filer som separat spår. Navy-zone-footer, tintband för "Fler datum", accentdisciplin, ev. SVG-vågen. Därefter, som mätbart tillval: navy-titelbandet (B:s platta) testat mot de 20 fulaste eventen i databasen.

### Etapp 3 — valfritt

Sticky botten-CTA bakom flagga (mät utklick i analytics), kategorifärgsystemet (6 familjer), desktop-polish.

**Total realistisk budget: 6–8 dagar** för fas 0–2 (skeptikerns ×1,5 på förslagens 3,5–5 är rätt kalibrering för solo-dev + okontrollerat feedinnehåll + två OS + tillgänglighets-QA). QA-listan är del av scopet, inte ett appendix: event utan bild/venue/tid, passerade event, extremt långa titlar, VoiceOver, zoom 200 %, reduced-motion.

---

## 6. Gör INTE

- **Ta inte bort `<Breadcrumbs />` utan att först splitta ut JSON-LD-schemat** — det ligger i samma komponent (Breadcrumbs.tsx:41–45) och försvinner annars med UI:t. Verifiera i Search Console efteråt.
- **Gör inte "Tillbaka" till `history.back()`** — för Google-landare (majoriteten) är det en exit till Google.
- **Skriv inte "Biljetter" i CTA:n för biljettlösa event** — halva databasen är gratisföreläsningar och familjeaktiviteter; en lurad 75-åring kommer inte tillbaka.
- **Ingen stagger-in/load-animation.** Innehåll som tonar in i sekvens fördröjer lässtart och flyttar LCP bakåt på sajtens viktigaste SEO-sidtyp. Motion-budget: whileTap + ev. sticky-barens slide-up. Punkt.
- **Ingen swipe-only-karusell.** Behåll en synlig framåt-affordans utöver peek.
- **Ingen 12 px spärrad versal-overline, och gör den inte till primär kategorinavigering** — minst läsbara textformen för äldre ögon, för liten träffyta.
- **Byt inte brödtextfont "i förbifarten".** Poppins→Inter är en 20-filers migrering med CLS-risk, inte en detaljsidesändring.
- **Ingen Fraunces/trend-serif vald för att kultursajter använder den 2026** — väljs font senare, välj på uppgiften (svenska tecken, långa arrangörstitlar, tung vikt i små grader).
- **Ingen mörk grundton för hela sajten** — kvällsekonomi-estetik är fel för sagostunden kl 10:00. Navy = zoner, aldrig läsyta.
- **Ingen klar signalfärg under 4,5:1 som textbärare** (poppy `#E2532F` 3,4:1, solgul på ljust 1,6:1). Definiera bara varianter som klarar text, så kan regeln inte brytas.
- **Byt inte sand-hexen för en "marginellt varmare" nyans** — osynlig vinst, verklig QA-kostnad.
- **Sticky botten-bar utan `safe-area-inset` och utan flagga** — iOS-bottenlisten staplar annars ~130 px lister över home-gesten.
- **Använd inte `ivarberg-design-system.json` som referens** — den beskriver en annan sajt. Radera den.
- **Lita inte på förslagens tidsestimat rakt av** — planera 6–8 dagar, inte 3,5.

---

## 7. Källor

**Kodbas (verifierade referenser):**
- `src/pages/EventDetail.tsx` (DOM-ordning :324–736; Event-JSON-LD :319; duplicerat platsblock :495–578; CTA :633–663)
- `src/components/Breadcrumbs.tsx` (:41–45 schema + synlig nav i samma komponent)
- `src/index.css` (:9–110 tokens; :171–173 brödtext; :189–192 död textur), `tailwind.config.ts` (:51–68), `src/components/ui/button.tsx`, `src/components/SimilarEventsCarousel.tsx`, `src/components/Hero.tsx`, `src/components/EventDescription.tsx`, `src/pages/Index.tsx`
- Kontrastberäkningar: WCAG 2.x relativ luminans, verifierade programmatiskt (script i sessionens scratchpad: `contrast.py`)

**Skärmdumpar (mobil, eventdetalj):** tre skärmavbilder 2026-07-18 (topp/mitt/botten) på skrivbordet.

**Designspråk-teardowns:**
- Göteborgs Stad: Grafisk profil (goteborg.se), Styleguide/Storybook (webapp.goteborg.se/public/styleguide), `frontend-design-core.min.css` (microservices.goteborg.se), `ui-framework.min.css`, goteborg.com evenemangskalender — tint-ramper, `c-navigation-tile` (3 px vänsterkant + lightest-tint), `c-hero--wave`, 800-viktrubriker, 44 px touch-mål
- Stockholms stad: varumarkesmanual.stockholm, webbmanual.stockholm, start.stockholm, kulturhusetstadsteatern.se, visitstockholm.com — display-vikt endast i rubriker, grå bas + accentdisciplin, gul-förbudet på ljus yta, kategori som textlabel, en-rads breadcrumb
- Mönsterreferenser event-UX: DICE (scrim-knappar, "more dates"), Luma (tappbara metarader), Eventbrite (bottenchips, 2:1-bild), Fever (sticky CTA)
- NN/g om breadcrumbs på grunda hierarkier; Googles riktlinjer för strukturerad data (markup ska spegla synligt innehåll)
