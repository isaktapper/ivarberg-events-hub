import type { VercelRequest, VercelResponse } from '@vercel/node';

// Serverrenderad landningssida för AI-sök/SEO (se docs/SEO_AI_PLAN.md).
// Nås via rewrite i vercel.json, t.ex. /idag -> /api/landing?period=idag.
// Renderas per request så innehållet alltid är dagsfärskt – ingen cron behövs.

const SITE = 'https://ivarberg.nu';
const TZ = 'Europe/Stockholm';

interface DbEvent {
  event_id: string;
  name: string;
  date_time: string; // naiv svensk lokaltid, ex "2026-07-14T10:30:00"
  venue_name: string | null;
  location: string | null;
  price: string | null;
  categories: string[] | null;
  description: string | null;
  image_url: string | null;
  featured: boolean;
}

interface PeriodConfig {
  slug: string;
  h1: string;
  titleLabel: (dateLabel: string) => string;
  intro: string; // ordet som beskriver perioden i löptext, ex "idag"
  from: (today: string) => string; // YYYY-MM-DD (inklusive)
  to: (today: string) => string;   // YYYY-MM-DD (exklusive)
}

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().split('T')[0];
}

const PERIODS: Record<string, PeriodConfig> = {
  idag: {
    slug: 'idag',
    h1: 'Vad händer i Varberg idag?',
    titleLabel: (dateLabel) => `Vad händer i Varberg idag, ${dateLabel}?`,
    intro: 'idag',
    from: (today) => today,
    to: (today) => addDays(today, 1),
  },
};

// Dagens datum i svensk tid (serverlösa funktioner kör i UTC)
function stockholmToday(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(new Date());
}

function svDateLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  const weekday = new Intl.DateTimeFormat('sv-SE', { weekday: 'long', timeZone: 'UTC' }).format(dt);
  const dayMonth = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(dt);
  return `${weekday} ${dayMonth}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Grov markdown -> ren text för korta beskrivningar
function plainText(md: string | null, maxLen = 180): string {
  if (!md) return '';
  const text = md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_`>~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

function eventTime(e: DbEvent): string | null {
  const t = e.date_time.slice(11, 16);
  return t === '00:00' ? null : t.replace(':', '.');
}

function eventDayLabel(e: DbEvent): string {
  return svDateLabel(e.date_time.slice(0, 10));
}

function mainCategory(e: DbEvent): string {
  return e.categories?.[0] || 'Evenemang';
}

interface PriceInfo { free: boolean; amount: number | null; label: string | null }
function parsePrice(p: string | null): PriceInfo {
  if (!p || !p.trim()) return { free: false, amount: null, label: null };
  const s = p.trim();
  if (/^(gratis|fri entré|fritt inträde|0)$/i.test(s)) return { free: true, amount: 0, label: 'Gratis' };
  const m = s.match(/(\d+(?:[.,]\d+)?)/);
  const amount = m ? parseFloat(m[1].replace(',', '.')) : null;
  return { free: false, amount, label: s };
}

// Välj periodens "hetaste" event: featured först, därefter events med tid,
// plats och beskrivning – med spridning över kategorier.
function pickHighlights(events: DbEvent[], count = 3): DbEvent[] {
  const scored = [...events].sort((a, b) => {
    const score = (e: DbEvent) =>
      (e.featured ? 8 : 0) +
      (eventTime(e) ? 2 : 0) +
      (e.venue_name ? 1 : 0) +
      (e.description ? 1 : 0);
    return score(b) - score(a);
  });
  const picked: DbEvent[] = [];
  const usedCategories = new Set<string>();
  for (const e of scored) {
    if (picked.length >= count) break;
    if (usedCategories.has(mainCategory(e)) && scored.length > count) continue;
    picked.push(e);
    usedCategories.add(mainCategory(e));
  }
  for (const e of scored) {
    if (picked.length >= count) break;
    if (!picked.includes(e)) picked.push(e);
  }
  return picked;
}

// Självständigt svarsblock (~134–167 ord) – det AI-översikten kan citera
function buildIntro(period: PeriodConfig, dateLabel: string, events: DbEvent[], highlights: DbEvent[]): string {
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
    return t
      ? `Kl. ${t} börjar ${e.name}${venue}${pricePart}`
      : `${e.name} pågår under dagen${venue}${pricePart}`;
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
  const evening = events.find(
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

function eventJsonLd(e: DbEvent) {
  const price = parsePrice(e.price);
  const ld: Record<string, unknown> = {
    '@type': 'Event',
    name: e.name,
    startDate: e.date_time,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url: `${SITE}/event/${e.event_id}`,
    location: {
      '@type': 'Place',
      name: e.venue_name || 'Varberg',
      address: e.location || 'Varberg, Sweden',
    },
  };
  if (e.description) ld.description = plainText(e.description, 300);
  if (e.image_url) ld.image = e.image_url;
  if (price.amount !== null) {
    ld.isAccessibleForFree = price.free;
    ld.offers = {
      '@type': 'Offer',
      price: price.amount,
      priceCurrency: 'SEK',
      url: `${SITE}/event/${e.event_id}`,
      availability: 'https://schema.org/InStock',
    };
  }
  return ld;
}

function jsonLdScript(events: DbEvent[], period: PeriodConfig, title: string, description: string): string {
  const graph = [
    {
      '@type': 'WebPage',
      '@id': `${SITE}/${period.slug}`,
      url: `${SITE}/${period.slug}`,
      name: title,
      description,
      inLanguage: 'sv-SE',
      isPartOf: { '@type': 'WebSite', name: 'ivarberg.nu', url: SITE },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ivarberg.nu', item: SITE },
        { '@type': 'ListItem', position: 2, name: period.h1, item: `${SITE}/${period.slug}` },
      ],
    },
    {
      '@type': 'ItemList',
      itemListElement: events.map((e, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: eventJsonLd(e),
      })),
    },
  ];
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

// Inline-SVG:er (lucide-ikonerna som SPA:n använder)
const ICONS = {
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
};

function imageAlt(e: DbEvent): string {
  return `${e.name} - ${mainCategory(e)} evenemang i Varberg`;
}

function eventImage(e: DbEvent): string {
  return e.image_url ? escapeHtml(e.image_url) : '/placeholder.svg';
}

// Grid-kort som speglar EventCard.tsx (bild överst, badge, ikon-cirklar, Läs mer)
function highlightCard(e: DbEvent, multiDay: boolean): string {
  const t = eventTime(e);
  const desc = plainText(e.description, 120);
  return `<a class="ecard" href="/event/${escapeHtml(e.event_id)}">
    <div class="ecard-img">
      <img src="${eventImage(e)}" alt="${escapeHtml(imageAlt(e))}" loading="lazy">
      <span class="ecard-badge">${escapeHtml(mainCategory(e))}</span>
    </div>
    <div class="ecard-body">
      <h3>${escapeHtml(e.name)}</h3>
      <div class="row"><span class="icon-circle">${ICONS.calendar}</span>${escapeHtml(eventDayLabel(e))}</div>
      ${t ? `<div class="row"><span class="icon-circle">${ICONS.clock}</span>kl. ${escapeHtml(t)}</div>` : ''}
      ${e.venue_name ? `<div class="row"><span class="icon-circle">${ICONS.pin}</span>${escapeHtml(e.venue_name)}</div>` : ''}
      ${desc ? `<p class="desc">${escapeHtml(desc)}</p>` : ''}
      <span class="more">Läs mer</span>
    </div>
  </a>`;
}

// Listrad som speglar EventListItem.tsx (bild vänster, badge i hörnet, pil höger)
function eventRow(e: DbEvent, multiDay: boolean): string {
  const t = eventTime(e);
  const date = e.date_time.slice(0, 10);
  const timeLabel = t ? `${date} - ${t.replace('.', ':')}` : `${date} - Hela dagen`;
  return `<li><a class="litem" href="/event/${escapeHtml(e.event_id)}">
    <span class="litem-img">
      <img src="${eventImage(e)}" alt="${escapeHtml(imageAlt(e))}" loading="lazy">
      <span class="litem-badge">${escapeHtml(mainCategory(e))}</span>
    </span>
    <span class="litem-body">
      <h3>${escapeHtml(e.name)}</h3>
      <span class="litem-rows">
        <span class="litem-row">${ICONS.calendar}${escapeHtml(timeLabel)}</span>
        ${e.venue_name ? `<span class="litem-row">${ICONS.pin}${escapeHtml(e.venue_name)}</span>` : ''}
      </span>
    </span>
    <span class="litem-arrow">${ICONS.arrow}</span>
  </a></li>`;
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
  const intro = fallback ? '' : buildIntro(period, dateLabel, events, highlights);
  const title = `${period.titleLabel(dateLabel)} | ivarberg.nu`;
  const metaDescription = fallback
    ? `Inga evenemang i Varberg ${period.intro} (${dateLabel}) – men här är kommande höjdpunkter. Uppdateras dagligen.`
    : `${events.length} evenemang i Varberg ${period.intro}, ${dateLabel}: ${highlights
        .map((e) => e.name)
        .slice(0, 3)
        .join(', ')}. Tider, platser och priser – uppdateras dagligen.`;
  const canonical = `${SITE}/${period.slug}`;

  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(metaDescription)}">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="/favicon_light.png" media="(prefers-color-scheme: light)">
<link rel="icon" href="/favicon_dark.png" media="(prefers-color-scheme: dark)">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(metaDescription)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}/og-image.jpg">
<meta property="og:locale" content="sv_SE">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Outfit:wght@700;800&display=swap" rel="stylesheet">
${jsonLdScript(events, period, title, metaDescription)}
<style>
  /* Speglar startsidans design: Hero.tsx, EventCard.tsx, EventListItem.tsx, Footer.tsx, src/index.css */
  :root { --navy:#08075C; --ocean:hsl(217 91% 42%); --beige:hsl(32 44% 96%); --text:hsl(215 25% 15%); --muted:hsl(215 15% 45%); --border:hsl(210 20% 90%); --accent:#4A90E2; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Poppins',system-ui,sans-serif; color:var(--text); background:var(--beige); line-height:1.6; }
  .nav { position:sticky; top:0; z-index:30; background:rgba(255,255,255,.92); backdrop-filter:blur(8px); border-bottom:1px solid rgba(8,7,92,.08); }
  .nav-inner { max-width:72rem; margin:0 auto; display:flex; align-items:center; gap:1.5rem; padding:.65rem 1.5rem; }
  .nav img { height:2rem; width:auto; display:block; }
  .nav-links { display:flex; gap:1.25rem; margin-left:auto; }
  .nav-links a { color:var(--navy); opacity:.85; text-decoration:none; font-size:.9rem; font-weight:500; }
  .nav-links a:hover { color:var(--accent); opacity:1; }
  .nav-cta { background:var(--navy); color:#fff; font-size:.85rem; font-weight:700; padding:.5rem 1rem; border-radius:.375rem; text-decoration:none; white-space:nowrap; }
  /* Hero med bakgrundsbild, gradient och våg – som Hero.tsx */
  .hero { position:relative; overflow:hidden; }
  .hero-bg { position:absolute; inset:0; background:url('/hero_spring.webp') center/cover no-repeat; }
  .hero-overlay { position:absolute; inset:0; background:linear-gradient(to bottom, rgba(0,0,0,.6), rgba(0,0,0,.2) 45%, hsl(32 44% 96%)); }
  .hero-content { position:relative; z-index:2; max-width:64rem; margin:0 auto; padding:3.5rem 1.5rem 9rem; text-align:center; }
  .hero-badge { display:inline-flex; align-items:center; gap:.5rem; padding:.4rem 1rem; font-size:.85rem; font-weight:500; border-radius:9999px; color:#fff; background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.3); backdrop-filter:blur(12px); text-decoration:none; margin-bottom:2rem; box-shadow:0 4px 12px rgba(0,0,0,.1); }
  .hero-badge svg { width:.9rem; height:.9rem; opacity:.8; }
  .hero h1 { font-family:'Outfit','Poppins',sans-serif; font-size:clamp(2.5rem,7vw,4.5rem); line-height:1.1; color:#fff; font-weight:700; letter-spacing:-.02em; filter:drop-shadow(0 8px 30px rgba(0,0,0,.8)); margin-bottom:1.25rem; }
  .hero-sub { color:rgba(255,255,255,.9); font-size:1.15rem; font-weight:500; text-shadow:0 2px 8px rgba(0,0,0,.5); }
  .wave { position:absolute; bottom:-2px; left:0; right:0; z-index:1; pointer-events:none; }
  .wave svg { display:block; width:100%; height:auto; min-height:80px; }
  main { max-width:72rem; margin:-4.5rem auto 0; position:relative; z-index:2; padding:0 1.5rem 3rem; }
  .intro { max-width:52rem; margin:0 auto 1rem; background:rgba(255,255,255,.9); backdrop-filter:blur(4px); border:1px solid rgba(255,255,255,.5); border-radius:1rem; box-shadow:0 2px 12px hsl(217 91% 42% / .1); padding:1.4rem 1.6rem; font-size:1.02rem; }
  /* Hela texten finns i HTML (SEO/AI-citering) men visas ihopfälld – Visa mer expanderar utan JS */
  .intro-text { display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden; }
  #intro-toggle:checked ~ .intro-text { display:block; -webkit-line-clamp:unset; }
  .intro-more { display:inline-block; margin-top:.5rem; color:var(--accent); font-weight:600; font-size:.9rem; cursor:pointer; }
  .intro-more:hover { text-decoration:underline; }
  #intro-toggle:checked ~ .intro-more .show { display:none; }
  #intro-toggle:not(:checked) ~ .intro-more .hide { display:none; }
  h2 { text-align:center; font-size:clamp(1.5rem,3vw,2rem); color:var(--navy); font-weight:700; margin:3rem 0 1.5rem; }
  /* Höjdpunktskort – som EventCard.tsx */
  .grid3 { display:grid; grid-template-columns:1fr; gap:1.5rem; }
  @media (min-width:768px) { .grid3 { grid-template-columns:repeat(3,1fr); } }
  .ecard { display:flex; flex-direction:column; background:rgba(255,255,255,.9); backdrop-filter:blur(4px); border:1px solid rgba(255,255,255,.5); border-radius:1rem; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.06); text-decoration:none; transition:all .3s; }
  .ecard:hover { box-shadow:0 8px 32px hsl(217 91% 42% / .16); transform:translateY(-4px); background:rgba(255,255,255,.95); }
  .ecard-img { position:relative; height:12rem; overflow:hidden; }
  .ecard-img img { width:100%; height:100%; object-fit:cover; transition:transform .5s ease-out; }
  .ecard:hover .ecard-img img { transform:scale(1.05); }
  .ecard-badge { position:absolute; top:1rem; left:1rem; background:rgba(255,255,255,.9); backdrop-filter:blur(4px); color:#1e3a8a; font-size:.75rem; font-weight:600; padding:.35rem .75rem; border-radius:9999px; box-shadow:0 4px 12px rgba(0,0,0,.15); }
  .ecard-body { display:flex; flex-direction:column; flex:1; padding:1.5rem; }
  .ecard h3 { color:var(--navy); font-size:1.2rem; font-weight:700; line-height:1.35; margin-bottom:1rem; }
  .ecard .row { display:flex; align-items:center; gap:.75rem; font-size:.85rem; font-weight:500; color:#4b5563; margin-bottom:.65rem; }
  .icon-circle { display:flex; align-items:center; justify-content:center; width:2rem; height:2rem; border-radius:9999px; background:#eff6ff; flex-shrink:0; }
  .icon-circle svg { width:1rem; height:1rem; color:#2563eb; }
  .ecard .desc { font-size:.85rem; color:#4b5563; margin:.35rem 0 1.25rem; }
  .ecard .more { margin-top:auto; text-align:center; background:linear-gradient(to right,#3b82f6,#2563eb); color:#fff; font-weight:500; font-size:.9rem; padding:.65rem; border-radius:.5rem; box-shadow:0 1px 3px rgba(0,0,0,.1); }
  /* Listrader – som EventListItem.tsx */
  ul.events { list-style:none; max-width:64rem; margin:0 auto; display:flex; flex-direction:column; gap:.9rem; }
  .litem { display:flex; background:#fff; border:1px solid var(--border); border-radius:.75rem; overflow:hidden; text-decoration:none; transition:box-shadow .2s; }
  .litem:hover { box-shadow:0 4px 16px hsl(217 91% 42% / .12); }
  .litem-img { position:relative; width:7rem; flex-shrink:0; }
  @media (min-width:640px) { .litem-img { width:9rem; } }
  .litem-img img { width:100%; height:100%; object-fit:cover; display:block; }
  .litem-badge { position:absolute; top:0; left:0; background:rgba(255,255,255,.9); backdrop-filter:blur(4px); color:#1e3a8a; font-size:.7rem; font-weight:500; padding:.25rem .5rem; border-bottom-right-radius:.5rem; }
  .litem-body { flex:1; min-width:0; display:flex; flex-direction:column; padding:1rem 1.25rem; min-height:7rem; }
  .litem h3 { font-size:.98rem; font-weight:600; color:var(--text); line-height:1.35; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
  .litem-rows { margin-top:auto; display:flex; flex-direction:column; gap:.25rem; padding-top:.5rem; }
  .litem-row { display:flex; align-items:center; gap:.35rem; font-size:.78rem; color:var(--muted); }
  .litem-row svg { width:.75rem; height:.75rem; flex-shrink:0; }
  .litem-arrow { display:flex; align-items:center; padding-right:1.25rem; color:var(--muted); }
  .litem-arrow svg { width:1rem; height:1rem; }
  .cta-wrap { text-align:center; }
  .cta { display:inline-block; margin-top:2.5rem; background:linear-gradient(135deg,hsl(217 91% 42%),hsl(210 100% 56%)); color:#fff; font-weight:600; text-decoration:none; border-radius:9999px; padding:.9rem 2rem; box-shadow:0 4px 16px hsl(217 91% 42% / .12); transition:box-shadow .2s; }
  .cta:hover { box-shadow:0 8px 32px hsl(217 91% 42% / .16); }
  footer { background:#fff; border-top:1px solid rgba(8,7,92,.1); margin-top:4rem; }
  .footer-grid { max-width:72rem; margin:0 auto; padding:3rem 1.5rem 0; display:grid; grid-template-columns:1fr; gap:2rem; }
  @media (min-width:640px) { .footer-grid { grid-template-columns:1fr 1fr; } }
  @media (min-width:1024px) { .footer-grid { grid-template-columns:repeat(5,1fr); } }
  footer h3 { color:var(--navy); font-size:1.15rem; margin-bottom:.75rem; }
  footer h4 { color:var(--navy); font-size:.95rem; margin-bottom:.75rem; }
  footer p, footer li, footer a { color:rgba(8,7,92,.7); font-size:.85rem; }
  footer ul { list-style:none; }
  footer li { margin-bottom:.45rem; }
  footer a { text-decoration:none; }
  footer a:hover { color:var(--accent); }
  .copyright { max-width:72rem; margin:2rem auto 0; padding:1.5rem; border-top:1px solid rgba(8,7,92,.1); text-align:center; font-size:.85rem; color:rgba(8,7,92,.7); }
  @media (max-width:640px) { .nav-links { display:none; } .nav-inner { gap:.75rem; padding:.6rem 1rem; } .nav img { height:1.75rem; } .nav-cta { margin-left:auto; font-size:.75rem; padding:.45rem .7rem; } .hero-content { padding-bottom:7rem; } }
</style>
</head>
<body>
<header class="nav">
  <div class="nav-inner">
    <a href="/"><img src="/logo.png" alt="ivarberg.nu"></a>
    <nav class="nav-links">
      <a href="/">Alla evenemang</a>
      <a href="/om-oss">Om oss</a>
    </nav>
    <a class="nav-cta" href="/tips">Tipsa oss om evenemang</a>
  </div>
</header>
<section class="hero">
  <div class="hero-bg"></div>
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <a class="hero-badge" href="/tips">Tipsa oss om evenemang ${ICONS.chat}</a>
    <h1>${escapeHtml(period.h1)}</h1>
    <p class="hero-sub">${escapeHtml(dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1))} · ${
      fallback ? 'Se kommande evenemang' : `${events.length} evenemang i Varberg`
    }</p>
  </div>
  <div class="wave"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="hsl(32 44% 96%)" fill-opacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg></div>
</section>
<main>
${
  fallback
    ? `  <div class="intro"><p>Inga evenemang är inplanerade i Varberg ${escapeHtml(period.intro)}. Här är i stället de närmaste kommande evenemangen – hela kalendern hittar du på <a href="/">startsidan</a>.</p></div>
  <h2>Kommande evenemang i Varberg</h2>`
    : `  <div class="intro">
    <input type="checkbox" id="intro-toggle" hidden>
    <p class="intro-text">${escapeHtml(intro)}</p>
    <label for="intro-toggle" class="intro-more"><span class="show">Visa mer</span><span class="hide">Visa mindre</span></label>
  </div>
  <h2>Dagens ${highlights.length} höjdpunkter</h2>
  <div class="grid3">
${highlights.map((e) => highlightCard(e, multiDay)).join('\n')}
  </div>
  <h2>Alla evenemang ${escapeHtml(period.intro)} (${events.length})</h2>`
}
  <ul class="events">
${events.map((e) => eventRow(e, multiDay || fallback)).join('\n')}
  </ul>
  <div class="cta-wrap"><a class="cta" href="/">Se hela kalendern och filtrera på kategori</a></div>
</main>
<footer>
  <div class="footer-grid">
    <div>
      <h3>ivarberg.nu</h3>
      <p>Din kompletta guide till Varbergs puls. Missa aldrig ett evenemang igen!</p>
    </div>
    <div>
      <h4>Snabblänkar</h4>
      <ul>
        <li><a href="/">Alla evenemang</a></li>
        <li><a href="/evenemang-varberg">Evenemang Varberg</a></li>
        <li><a href="/att-gora-i-varberg">Att göra i Varberg</a></li>
        <li><a href="/varberg-kalender">Varberg Kalender</a></li>
        <li><a href="/tips">Tipsa oss</a></li>
        <li><a href="/om-oss">Om oss</a></li>
      </ul>
    </div>
    <div>
      <h4>Kategorier</h4>
      <ul>
        <li><a href="/?category=Scen">Scen &amp; Teater</a></li>
        <li><a href="/?category=Sport">Sport</a></li>
        <li><a href="/?category=Mat%20%26%20Dryck">Mat &amp; Dryck</a></li>
        <li><a href="/?category=Barn%20%26%20Familj">Barn &amp; Familj</a></li>
        <li><a href="/?category=Nattliv">Nattliv</a></li>
        <li><a href="/?category=Utst%C3%A4llningar">Utställningar</a></li>
      </ul>
    </div>
    <div>
      <h4>Kontakt</h4>
      <ul>
        <li>info@ivarberg.nu</li>
        <li>Fästningsgatan 5, 432 44 Varberg</li>
      </ul>
    </div>
    <div>
      <h4>Följ oss</h4>
      <ul>
        <li><a href="https://instagram.com/ivarberg.nu" target="_blank" rel="noopener noreferrer">Instagram</a></li>
      </ul>
    </div>
  </div>
  <div class="copyright">&copy; ${new Date().getFullYear()} ivarberg.nu - Alla rättigheter förbehållna</div>
</footer>
</body>
</html>`;
}

async function fetchEvents(from: string, to: string, limit = 200): Promise<DbEvent[] | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    return null;
  }
  const select = 'event_id,name,date_time,venue_name,location,price,categories,description,image_url,featured';
  const url =
    `${supabaseUrl}/rest/v1/events?status=eq.published` +
    `&date_time=gte.${from}T00:00:00&date_time=lt.${to}T00:00:00` +
    `&select=${select}&order=date_time.asc&limit=${limit}`;
  const res = await fetch(url, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  if (!res.ok) {
    console.error(`Failed to fetch events: HTTP ${res.status}`);
    return null;
  }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const periodKey = typeof req.query.period === 'string' ? req.query.period : 'idag';
    const period = PERIODS[periodKey];
    if (!period) {
      return res.status(404).send('Not found');
    }

    const today = stockholmToday();
    const from = period.from(today);
    const to = period.to(today);

    let events = await fetchEvents(from, to);
    if (events === null) {
      // Supabase nere/felkonfigurerad: låt SPA:n ta över i stället för att visa en tom sida
      res.setHeader('Cache-Control', 'no-store');
      return res.redirect(302, '/');
    }

    let fallback = false;
    if (events.length === 0) {
      fallback = true;
      events = (await fetchEvents(to, addDays(today, 14), 10)) || [];
    }

    const html = renderPage({
      period,
      dateLabel: svDateLabel(today),
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
