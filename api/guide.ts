import type { VercelRequest, VercelResponse } from '@vercel/node';

// De tre ombyggda guide-sidorna, serverrenderade i en gemensam funktion:
//   /evenemang-varberg  -> /api/guide?page=evenemang-varberg   (hubben)
//   /att-gora-i-varberg -> /api/guide?page=att-gora-i-varberg  (kurerad guide)
//   /varberg-kalender   -> /api/guide?page=varberg-kalender    (dag för dag)
// Rewrites i vercel.json. Ersätter de gamla statiska React-sidorna.

import { SITE, CATEGORIES } from './_lib/constants.js';
import { stockholmToday, addDays } from './_lib/dates.js';
import { fetchEvents, organizerSlug, type DbEvent } from './_lib/supabase.js';
import { escapeHtml, pickHighlights, dedupeByName } from './_lib/events.js';
import { pageJsonLd, type FaqItem } from './_lib/jsonld.js';
import {
  layout,
  highlightCard,
  eventRow,
  recommendationGrid,
  categoryTileGrid,
  areaChipRow,
  periodChipRow,
  chipRow,
  proseSection,
  dayGroupedList,
} from './_lib/render.js';
import { RESTAURANTS, BEACHES, SIGHTS, ACTIVITIES } from './_lib/recommendations.js';
import {
  ATT_GORA_INTRO,
  SEASONS_HTML,
  PLANERA_HTML,
  ATT_GORA_FAQ,
  EVENEMANG_INTRO,
  VARFOR_HTML,
  KALENDER_INTRO,
  KALENDER_HOW_HTML,
} from './_lib/copy.js';

function introBlock(text: string): string {
  return `  <div class="intro">
    <input type="checkbox" id="intro-toggle" hidden>
    <p class="intro-text">${escapeHtml(text)}</p>
    <label for="intro-toggle" class="intro-more"><span class="show">Visa mer</span><span class="hide">Visa mindre</span></label>
  </div>`;
}

function organizerChips(events: DbEvent[]): string {
  const chips = [
    ...new Map(
      events
        .filter((e) => organizerSlug(e))
        .map((e) => [
          organizerSlug(e)!,
          { href: `/arrangor/${organizerSlug(e)}`, label: e.organizer!.name },
        ])
    ).values(),
  ].slice(0, 6);
  if (chips.length === 0) return '';
  return `  <h2>Populära arrangörer</h2>
${chipRow(chips)}`;
}

// ---------- /evenemang-varberg – hubben ----------
function buildEvenemangVarberg(allEvents: DbEvent[]): string {
  const events = dedupeByName(allEvents);
  const canonical = `${SITE}/evenemang-varberg`;
  const title = 'Evenemang i Varberg – din kompletta guide | ivarberg.nu';
  const highlights = pickHighlights(events);
  const metaDescription =
    events.length > 0
      ? `Guide till alla evenemang i Varberg: ${events.length} evenemang den närmaste veckan, 13 kategorier och 8 områden. ${highlights
          .slice(0, 2)
          .map((e) => e.name)
          .join(', ')} med flera. Uppdateras dagligen.`
      : 'Guide till alla evenemang i Varberg – kategorier, områden och veckans höjdpunkter. Uppdateras dagligen.';

  // Live-antal per kategori ur veckans event
  const counts: Record<string, number> = {};
  for (const c of CATEGORIES) {
    counts[c.name] = events.filter((e) => e.categories?.includes(c.name)).length;
  }

  const dynamic =
    highlights.length > 0
      ? ` Den här veckan väntar bland annat ${highlights
          .slice(0, 3)
          .map((e) => e.name)
          .join(', ')}.`
      : '';

  const listCapped = events.slice(0, 20);
  const main = `${introBlock(EVENEMANG_INTRO + dynamic)}
  <h2>Hitta rätt direkt – välj kategori</h2>
${categoryTileGrid(counts)}
${
  highlights.length > 0
    ? `  <h2>Veckans höjdpunkter</h2>
  <div class="grid3">
${highlights.map((e) => highlightCard(e)).join('\n')}
  </div>
  <h2>Kommande 7 dagar (${events.length})</h2>
  <ul class="events">
${listCapped.map((e) => eventRow(e)).join('\n')}
  </ul>${events.length > listCapped.length ? `\n  <div class="cta-wrap"><a class="cta" href="/">Se alla ${events.length} evenemang i kalendern</a></div>` : ''}`
    : ''
}
${proseSection(VARFOR_HTML)}
${organizerChips(events)}
  <h2>När passar det dig?</h2>
${periodChipRow()}
  <h2>Utforska per område</h2>
${areaChipRow()}
  <h2>Mer att läsa</h2>
${chipRow([
    { href: '/att-gora-i-varberg', label: 'Att göra i Varberg' },
    { href: '/varberg-kalender', label: 'Varberg Kalender' },
  ])}`;

  return layout({
    title,
    metaDescription,
    canonical,
    jsonLd: pageJsonLd({
      url: canonical,
      title,
      description: metaDescription,
      pageType: 'CollectionPage',
      breadcrumbs: [
        { name: 'ivarberg.nu', item: SITE },
        { name: 'Evenemang i Varberg', item: canonical },
      ],
      events,
    }),
    h1: 'Evenemang i Varberg',
    heroSub:
      events.length > 0
        ? `${events.length} evenemang den närmaste veckan · 13 kategorier · 8 områden`
        : 'Din kompletta guide – kategorier, områden och veckans höjdpunkter',
    main,
  });
}

// ---------- /att-gora-i-varberg – kurerad guide ----------
function buildAttGora(allEvents: DbEvent[], today: string): string {
  const events = dedupeByName(allEvents);
  const canonical = `${SITE}/att-gora-i-varberg`;
  const title = 'Att göra i Varberg – aktiviteter, restauranger & upplevelser | ivarberg.nu';
  const todays = events.filter((e) => e.date_time.slice(0, 10) === today);
  const now = pickHighlights(todays.length > 0 ? todays : events);
  const metaDescription =
    'Vad kan man göra i Varberg? Våra bästa tips på restauranger, stränder, sevärdheter och aktiviteter – plus det som händer just nu. Uppdateras dagligen.';

  const faq: FaqItem[] = ATT_GORA_FAQ.map(({ q, a }) => ({ q, a }));
  const faqHtml = `<h2>Vanliga frågor om Varberg</h2>
${ATT_GORA_FAQ.map((f) => `<h3>${escapeHtml(f.q)}</h3>\n<p>${f.aHtml}</p>`).join('\n')}`;

  const main = `${introBlock(ATT_GORA_INTRO)}
${
  now.length > 0
    ? `  <h2>Händer just nu i Varberg</h2>
  <div class="grid3">
${now.map((e) => highlightCard(e)).join('\n')}
  </div>
  <div class="cta-wrap"><a class="cta" href="/idag">Allt som händer idag</a></div>`
    : ''
}
  <h2>Bästa restaurangerna i Varberg</h2>
${recommendationGrid(RESTAURANTS, '/att-gora-i-varberg')}
  <h2>Stränder &amp; bad</h2>
${recommendationGrid(BEACHES, '/att-gora-i-varberg')}
  <h2>Sevärdheter</h2>
${recommendationGrid(SIGHTS, '/att-gora-i-varberg')}
  <h2>Aktiviteter</h2>
${recommendationGrid(ACTIVITIES, '/att-gora-i-varberg')}
${proseSection(SEASONS_HTML)}
${proseSection(PLANERA_HTML)}
${proseSection(faqHtml)}
  <h2>När passar det dig?</h2>
${periodChipRow()}
  <h2>Utforska per område</h2>
${areaChipRow()}
  <div class="cta-wrap"><a class="cta" href="/evenemang-varberg">Hela guiden: Evenemang i Varberg</a></div>`;

  return layout({
    title,
    metaDescription,
    canonical,
    jsonLd: pageJsonLd({
      url: canonical,
      title,
      description: metaDescription,
      breadcrumbs: [
        { name: 'ivarberg.nu', item: SITE },
        { name: 'Att göra i Varberg', item: canonical },
      ],
      events: now,
      faq,
    }),
    h1: 'Att göra i Varberg',
    heroSub: 'Restauranger, stränder, sevärdheter – och det som händer just nu',
    main,
  });
}

// ---------- /varberg-kalender – dag för dag ----------
function buildKalender(events: DbEvent[]): string {
  const canonical = `${SITE}/varberg-kalender`;
  const title = 'Varberg kalender – evenemang dag för dag | ivarberg.nu';
  const metaDescription =
    events.length > 0
      ? `Varbergs eventkalender: ${events.length} evenemang de kommande 14 dagarna, dag för dag med tid, plats och pris. Uppdateras dagligen.`
      : 'Varbergs eventkalender dag för dag – tid, plats och pris för allt som händer. Uppdateras dagligen.';

  const dynamic =
    events.length > 0 ? ` Just nu ligger ${events.length} evenemang i kalendern de kommande två veckorna.` : '';

  const main = `${introBlock(KALENDER_INTRO + dynamic)}
  <h2>Snabbval</h2>
${periodChipRow()}
${
  events.length > 0
    ? dayGroupedList(events)
    : `  <div class="intro"><p>Kalendern är ovanligt tom just nu – nya evenemang publiceras löpande. Titta in på <a href="/">startsidan</a> eller <a href="/tips">tipsa oss</a> om något som saknas.</p></div>`
}
${proseSection(KALENDER_HOW_HTML)}
  <h2>Filtrera på kategori</h2>
${chipRow(CATEGORIES.map((c) => ({ href: `/kategori/${c.slug}`, label: c.name })))}
  <h2>Utforska per område</h2>
${areaChipRow()}
  <div class="cta-wrap"><a class="cta" href="/evenemang-varberg">Hela guiden: Evenemang i Varberg</a></div>`;

  return layout({
    title,
    metaDescription,
    canonical,
    jsonLd: pageJsonLd({
      url: canonical,
      title,
      description: metaDescription,
      pageType: 'CollectionPage',
      breadcrumbs: [
        { name: 'ivarberg.nu', item: SITE },
        { name: 'Varberg Kalender', item: canonical },
      ],
      events,
    }),
    h1: 'Varberg Kalender',
    heroSub:
      events.length > 0
        ? `${events.length} evenemang de kommande 14 dagarna`
        : 'Evenemang dag för dag – uppdateras dagligen',
    main,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const page = typeof req.query.page === 'string' ? req.query.page : '';
    if (!['evenemang-varberg', 'att-gora-i-varberg', 'varberg-kalender'].includes(page)) {
      return res.status(404).send('Not found');
    }

    const today = stockholmToday();
    const days = page === 'varberg-kalender' ? 14 : 7;
    const events = await fetchEvents({ from: today, to: addDays(today, days), limit: 200 });
    if (events === null) {
      res.setHeader('Cache-Control', 'no-store');
      return res.redirect(302, '/');
    }

    const html =
      page === 'evenemang-varberg'
        ? buildEvenemangVarberg(events)
        : page === 'att-gora-i-varberg'
          ? buildAttGora(events, today)
          : buildKalender(events);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Error rendering guide page:', error);
    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(302, '/');
  }
}
