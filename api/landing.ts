import type { VercelRequest, VercelResponse } from '@vercel/node';

// Serverrenderad landningssida för AI-sök/SEO (se docs/SEO_AI_PLAN.md).
// Nås via rewrite i vercel.json, t.ex. /idag -> /api/landing?period=idag.
// Renderas per request så innehållet alltid är dagsfärskt – ingen cron behövs.
// Delad rendering/hämtning ligger i api/_lib/ (används även av guide/kategori/område).

import { SITE } from './_lib/constants';
import { addDays, weekdayIndex, rangeLabel, weekendRange, stockholmToday, svDateLabel } from './_lib/dates';
import { fetchEvents, type DbEvent } from './_lib/supabase';
import { escapeHtml, eventTime, eventDayLabel, mainCategory, parsePrice, pickHighlights } from './_lib/events';
import { pageJsonLd } from './_lib/jsonld';
import { layout, highlightCard, eventRow } from './_lib/render';

interface PeriodConfig {
  slug: string;
  h1: string;
  highlightsTitle: string;
  titleLabel: (dateLabel: string) => string;
  intro: string; // ordet som beskriver perioden i löptext, ex "idag"
  range: (today: string) => { from: string; to: string }; // from inkl, to exkl (YYYY-MM-DD)
  label: (from: string, to: string) => string; // datumetikett för visning
}

const PERIODS: Record<string, PeriodConfig> = {
  idag: {
    slug: 'idag',
    h1: 'Vad händer i Varberg idag?',
    highlightsTitle: 'Dagens höjdpunkter',
    titleLabel: (dateLabel) => `Vad händer i Varberg idag, ${dateLabel}?`,
    intro: 'idag',
    range: (today) => ({ from: today, to: addDays(today, 1) }),
    label: (from) => svDateLabel(from),
  },
  imorgon: {
    slug: 'imorgon',
    h1: 'Vad händer i Varberg imorgon?',
    highlightsTitle: 'Morgondagens höjdpunkter',
    titleLabel: (dateLabel) => `Vad händer i Varberg imorgon, ${dateLabel}?`,
    intro: 'imorgon',
    range: (today) => ({ from: addDays(today, 1), to: addDays(today, 2) }),
    label: (from) => svDateLabel(from),
  },
  'i-helgen': {
    slug: 'i-helgen',
    h1: 'Vad händer i Varberg i helgen?',
    highlightsTitle: 'Helgens höjdpunkter',
    titleLabel: (dateLabel) => `Vad händer i Varberg i helgen, ${dateLabel}?`,
    intro: 'i helgen',
    range: weekendRange,
    label: rangeLabel,
  },
  'i-veckan': {
    slug: 'i-veckan',
    h1: 'Vad händer i Varberg i veckan?',
    highlightsTitle: 'Veckans höjdpunkter',
    titleLabel: (dateLabel) => `Vad händer i Varberg i veckan, ${dateLabel}?`,
    intro: 'i veckan',
    // Resten av innevarande vecka (idag t.o.m. söndag) – listar inte redan passerade dagar
    range: (today) => ({ from: today, to: addDays(today, 7 - weekdayIndex(today)) }),
    label: rangeLabel,
  },
};

// Självständigt svarsblock (~134–167 ord) – det AI-översikten kan citera
function buildIntro(
  period: PeriodConfig,
  dateLabel: string,
  events: DbEvent[],
  highlights: DbEvent[],
  multiDay: boolean
): string {
  if (events.length === 0) return '';
  const categories = [...new Set(events.map(mainCategory))];
  const catPhrase =
    categories.length > 1
      ? `inom bland annat ${categories.slice(0, 3).map((c) => c.toLowerCase()).join(', ')}`
      : '';
  const sentences = highlights.map((e) => {
    const t = eventTime(e);
    const venue = e.venue_name ? ` på ${e.venue_name}` : '';
    const price = parsePrice(e.price);
    const pricePart = price.free ? ' med fri entré' : '';
    const day = eventDayLabel(e);
    const dayPrefix = multiDay ? `${day.charAt(0).toUpperCase() + day.slice(1)} ` : '';
    return t
      ? `${dayPrefix}${multiDay ? 'kl.' : 'Kl.'} ${t} börjar ${e.name}${venue}${pricePart}`
      : `${e.name} pågår ${multiDay ? day : 'under dagen'}${venue}${pricePart}`;
  });
  const count = events.length === 1 ? 'ett evenemang' : `${events.length} evenemang`;

  const extras: string[] = [];
  const freeCount = events.filter((e) => parsePrice(e.price).free).length;
  if (freeCount > 0) {
    extras.push(
      freeCount === 1
        ? 'Ett av evenemangen har fri entré'
        : `${freeCount} av evenemangen har fri entré`
    );
  }
  // "Senare i kväll" är bara meningsfullt på idag-sidan
  const evening = multiDay
    ? undefined
    : events.find(
        (e) => !highlights.includes(e) && (eventTime(e) || '').replace('.', ':') >= '17:00'
      );
  if (evening) {
    extras.push(
      `Senare i kväll, kl. ${eventTime(evening)}, väntar ${evening.name}` +
        (evening.venue_name ? ` på ${evening.venue_name}` : '')
    );
  }
  const venues = [...new Set(events.map((e) => e.venue_name).filter(Boolean))] as string[];
  if (venues.length > 2) {
    extras.push(
      `Evenemangen äger rum på ${venues.length} olika platser runt om i Varberg, ` +
        `bland annat ${venues[0]} och ${venues[venues.length - 1]}`
    );
  }

  return (
    `${period.intro.charAt(0).toUpperCase() + period.intro.slice(1)}, ${dateLabel}, ` +
    `finns det ${count} i Varberg ${catPhrase}. `.replace(/ \. /, '. ') +
    sentences.join('. ') +
    '. ' +
    (extras.length ? extras.join('. ') + '. ' : '') +
    'Längre ned på sidan hittar du samtliga evenemang med tid, plats och pris, ' +
    'och varje evenemang har en egen sida med mer information om biljetter, arrangör och vägbeskrivning. ' +
    'Listan uppdateras löpande under dagen och samlar arrangörer från hela Varbergs kommun på ett och samma ställe.'
  );
}

function renderPage(opts: {
  period: PeriodConfig;
  dateLabel: string;
  events: DbEvent[];
  fallback: boolean; // true = inga event i perioden, visar kommande i stället
  multiDay: boolean;
}): string {
  const { period, dateLabel, events, fallback, multiDay } = opts;
  const highlights = fallback ? [] : pickHighlights(events);
  const intro = fallback ? '' : buildIntro(period, dateLabel, events, highlights, multiDay);
  const title = `${period.titleLabel(dateLabel)} | ivarberg.nu`;
  const metaDescription = fallback
    ? `Inga evenemang i Varberg ${period.intro} (${dateLabel}) – men här är kommande höjdpunkter. Uppdateras dagligen.`
    : `${events.length} evenemang i Varberg ${period.intro}, ${dateLabel}: ${highlights
        .map((e) => e.name)
        .slice(0, 3)
        .join(', ')}. Tider, platser och priser – uppdateras dagligen.`;
  const canonical = `${SITE}/${period.slug}`;

  const main = `${
    fallback
      ? `  <div class="intro"><p>Inga evenemang är inplanerade i Varberg ${escapeHtml(period.intro)}. Här är i stället de närmaste kommande evenemangen – hela kalendern hittar du på <a href="/">startsidan</a>.</p></div>
  <h2>Kommande evenemang i Varberg</h2>`
      : `  <div class="intro">
    <input type="checkbox" id="intro-toggle" hidden>
    <p class="intro-text">${escapeHtml(intro)}</p>
    <label for="intro-toggle" class="intro-more"><span class="show">Visa mer</span><span class="hide">Visa mindre</span></label>
  </div>
  <h2>${escapeHtml(period.highlightsTitle)}</h2>
  <div class="grid3">
${highlights.map((e) => highlightCard(e)).join('\n')}
  </div>
  <h2>Alla evenemang ${escapeHtml(period.intro)} (${events.length})</h2>`
  }
  <ul class="events">
${events.map((e) => eventRow(e)).join('\n')}
  </ul>
  <div class="cta-wrap"><a class="cta" href="/">Se hela kalendern och filtrera på kategori</a></div>`;

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
        { name: period.h1, item: canonical },
      ],
      events,
    }),
    h1: period.h1,
    heroSub: `${escapeHtml(dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1))} · ${
      fallback ? 'Se kommande evenemang' : `${events.length} evenemang i Varberg`
    }`,
    activePill: period.slug,
    main,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const periodKey = typeof req.query.period === 'string' ? req.query.period : 'idag';
    const period = PERIODS[periodKey];
    if (!period) {
      return res.status(404).send('Not found');
    }

    const today = stockholmToday();
    const { from, to } = period.range(today);

    let events = await fetchEvents({ from, to });
    if (events === null) {
      // Supabase nere/felkonfigurerad: låt SPA:n ta över i stället för att visa en tom sida
      res.setHeader('Cache-Control', 'no-store');
      return res.redirect(302, '/');
    }

    let fallback = false;
    if (events.length === 0) {
      fallback = true;
      events = (await fetchEvents({ from: to, to: addDays(to, 14), limit: 10 })) || [];
    }

    const html = renderPage({
      period,
      dateLabel: period.label(from, to),
      events,
      fallback,
      multiDay: addDays(from, 1) !== to,
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=3600');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Error rendering landing page:', error);
    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(302, '/');
  }
}
