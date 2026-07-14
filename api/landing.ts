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

function highlightCard(e: DbEvent, multiDay: boolean): string {
  const t = eventTime(e);
  const meta = [multiDay ? eventDayLabel(e) : null, t ? `kl. ${t}` : null, e.venue_name]
    .filter(Boolean)
    .map((s) => escapeHtml(s as string))
    .join(' · ');
  const price = parsePrice(e.price);
  const desc = plainText(e.description);
  return `<article class="card">
    <span class="badge">${escapeHtml(mainCategory(e))}</span>
    <h3><a href="/event/${escapeHtml(e.event_id)}">${escapeHtml(e.name)}</a></h3>
    <p class="meta">${meta}${price.label ? ` · ${escapeHtml(price.label)}` : ''}</p>
    ${desc ? `<p>${escapeHtml(desc)}</p>` : ''}
  </article>`;
}

function eventRow(e: DbEvent, multiDay: boolean): string {
  const t = eventTime(e);
  const timeLabel = multiDay ? `${eventDayLabel(e)}${t ? ` ${t}` : ''}` : t || 'Hela dagen';
  const price = parsePrice(e.price);
  return `<li>
    <span class="time">${escapeHtml(timeLabel)}</span>
    <span class="what"><a href="/event/${escapeHtml(e.event_id)}">${escapeHtml(e.name)}</a>
      ${e.venue_name ? `<span class="venue">${escapeHtml(e.venue_name)}</span>` : ''}</span>
    <span class="price">${escapeHtml(price.label || '')}</span>
  </li>`;
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
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
${jsonLdScript(events, period, title, metaDescription)}
<style>
  /* Färger/typografi speglar src/index.css + Footer.tsx (navy #08075C, ocean-blå, sandbeige) */
  :root { --navy:#08075C; --ocean:hsl(217 91% 42%); --beige:hsl(32 44% 96%); --text:hsl(215 25% 15%); --muted:hsl(215 15% 45%); --border:hsl(210 20% 90%); --accent:#4A90E2; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Poppins',system-ui,sans-serif; color:var(--text); background:var(--beige); line-height:1.6; }
  .nav { position:sticky; top:0; z-index:10; background:rgba(255,255,255,.92); backdrop-filter:blur(8px); border-bottom:1px solid rgba(8,7,92,.08); }
  .nav-inner { max-width:64rem; margin:0 auto; display:flex; align-items:center; gap:1.5rem; padding:.65rem 1.5rem; }
  .nav img { height:2rem; width:auto; display:block; }
  .nav-links { display:flex; gap:1.25rem; margin-left:auto; }
  .nav-links a { color:var(--navy); opacity:.85; text-decoration:none; font-size:.9rem; font-weight:500; }
  .nav-links a:hover { color:var(--accent); opacity:1; }
  .nav-cta { background:var(--navy); color:#fff; font-size:.85rem; font-weight:700; padding:.5rem 1rem; border-radius:.375rem; text-decoration:none; white-space:nowrap; }
  main { max-width:52rem; margin:0 auto; padding:2.5rem 1.5rem 3rem; }
  h1 { font-size:2.1rem; line-height:1.2; color:var(--navy); margin-bottom:.25rem; }
  .date { color:var(--muted); margin-bottom:1.5rem; }
  .intro { background:rgba(255,255,255,.9); border:1px solid rgba(255,255,255,.5); border-radius:1rem; box-shadow:0 2px 12px hsl(217 91% 42% / .1); padding:1.4rem 1.6rem; margin-bottom:2.25rem; font-size:1.02rem; }
  h2 { font-size:1.35rem; color:var(--navy); margin:2.25rem 0 1rem; }
  .card { background:rgba(255,255,255,.9); border:1px solid rgba(255,255,255,.5); border-radius:1rem; box-shadow:0 2px 12px hsl(217 91% 42% / .1); padding:1.25rem 1.5rem; margin-bottom:1rem; transition:box-shadow .2s; }
  .card:hover { box-shadow:0 8px 32px hsl(217 91% 42% / .16); }
  .badge { display:inline-block; background:#eff6ff; color:#2563eb; font-size:.75rem; font-weight:600; border-radius:9999px; padding:.25rem .75rem; }
  .card h3 { font-size:1.12rem; margin:.5rem 0 .15rem; }
  .card h3 a { color:var(--navy); text-decoration:none; }
  .card h3 a:hover { color:var(--accent); }
  .meta { color:var(--muted); font-size:.88rem; margin-bottom:.4rem; }
  ul.events { list-style:none; background:rgba(255,255,255,.9); border:1px solid rgba(255,255,255,.5); border-radius:1rem; box-shadow:0 2px 12px hsl(217 91% 42% / .1); overflow:hidden; }
  ul.events li { display:flex; gap:1rem; align-items:baseline; padding:.85rem 1.25rem; border-bottom:1px solid var(--border); }
  ul.events li:last-child { border-bottom:none; }
  ul.events .time { flex:0 0 7.5rem; font-weight:600; font-size:.88rem; color:var(--ocean); }
  ul.events .what { flex:1; }
  ul.events .what a { color:var(--navy); font-weight:600; text-decoration:none; }
  ul.events .what a:hover { color:var(--accent); }
  ul.events .venue { display:block; color:var(--muted); font-size:.83rem; font-weight:400; }
  ul.events .price { flex:0 0 auto; color:var(--muted); font-size:.83rem; }
  .cta { display:inline-block; margin-top:2.25rem; background:linear-gradient(135deg,hsl(217 91% 42%),hsl(210 100% 56%)); color:#fff; font-weight:600; text-decoration:none; border-radius:9999px; padding:.9rem 2rem; box-shadow:0 4px 16px hsl(217 91% 42% / .12); }
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
  @media (max-width:640px) { .nav-links { display:none; } h1 { font-size:1.7rem; } ul.events li { flex-wrap:wrap; } ul.events .time { flex-basis:100%; } }
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
<main>
  <h1>${escapeHtml(period.h1)}</h1>
  <p class="date">${escapeHtml(dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1))}</p>
${
  fallback
    ? `  <div class="intro"><p>Inga evenemang är inplanerade i Varberg ${escapeHtml(period.intro)}. Här är i stället de närmaste kommande evenemangen – hela kalendern hittar du på <a href="/">startsidan</a>.</p></div>
  <h2>Kommande evenemang i Varberg</h2>`
    : `  <div class="intro"><p>${escapeHtml(intro)}</p></div>
  <h2>Dagens ${highlights.length} höjdpunkter</h2>
${highlights.map((e) => highlightCard(e, multiDay)).join('\n')}
  <h2>Alla evenemang ${escapeHtml(period.intro)} (${events.length})</h2>`
}
  <ul class="events">
${events.map((e) => eventRow(e, multiDay || fallback)).join('\n')}
  </ul>
  <a class="cta" href="/">Se hela kalendern och filtrera på kategori</a>
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
