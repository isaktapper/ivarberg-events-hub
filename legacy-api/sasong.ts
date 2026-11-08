import type { VercelRequest, VercelResponse } from '@vercel/node';

// Säsongssidorna (/jul-i-varberg, /sommar-i-varberg, /sportlov-i-varberg …),
// serverrenderade från konfigurationen i _lib/seasons.ts.
//
// Design (designcanvas nov 2026, riktning C): kategoriplattor och rader som
// scrollar i sidled så att sidan blir kort på mobil. "Visa alla" öppnar hela
// listan för en rad dag för dag (?visa=<rad|alla|forra>, noindex). Egen enkel
// CSS i sand & hav-paletten (inga gradienter, inga skuggor).
//
// Innan årets program är publicerat visas förra årets evenemang som
// inspiration, så att sidan aldrig står tom mellan säsongerna.

import { SITE } from './_lib/constants';
import { stockholmToday, weekdayIndex, svDateLabel } from './_lib/dates';
import { fetchEvents, type DbEvent } from './_lib/supabase';
import { escapeHtml, eventTime, dedupeByName } from './_lib/events';
import { pageJsonLd } from './_lib/jsonld';
import { siteFooterHtml, SITE_FOOTER_CSS } from './_lib/footer';
import {
  SEASONS,
  findSeason,
  currentEdition,
  assignRail,
  type Season,
  type DateWindow,
  type KeyDate,
  type FaqCtx,
} from './_lib/seasons';
import { optimizedImage } from '../src/lib/images';

const RAIL_MAX = 10;
const PREV_THRESHOLD = 6; // färre unika event än så i årets upplaga → visa även förra året
const WD = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
const MONTHS_SHORT = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const ARROW =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function shortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${WD[weekdayIndex(iso)]} ${d} ${MONTHS_SHORT[m - 1]}`;
}

function joinSv(parts: string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} och ${parts[parts.length - 1]}`;
}

// ---------- Byggstenar ----------

function card(e: DbEvent): string {
  const date = e.date_time.slice(0, 10);
  const [, m, d] = date.split('-').map(Number);
  const t = eventTime(e);
  const media = e.image_url
    ? `<img src="${escapeHtml(optimizedImage(e.image_url, 480))}" alt="" width="250" height="140" loading="lazy">`
    : `<span class="db" aria-hidden="true"><span>${WD[weekdayIndex(date)]}</span><span class="dd">${d}</span><span>${MONTHS_SHORT[m - 1]}</span></span>`;
  return `<li><a class="card" href="/event/${escapeHtml(e.event_id)}">
  ${media}
  <span class="cb"><span class="w">${shortDate(date)}${t ? ` · ${t}` : ''}</span><span class="n">${escapeHtml(e.name)}</span>${
    e.venue_name ? `<span class="p">${escapeHtml(e.venue_name)}</span>` : ''
  }</span>
</a></li>`;
}

function rail(id: string, title: string, list: DbEvent[], href: string): string {
  const shown = list.slice(0, RAIL_MAX);
  const more =
    list.length > shown.length
      ? `<li class="more-card"><a href="${href}"><span>Visa alla ${list.length}</span>${ARROW}</a></li>`
      : '';
  return `<section class="rail-s" id="${id}">
  <div class="rail-h"><h2>${escapeHtml(title)}</h2>${list.length > 2 ? `<a href="${href}">Visa alla ${list.length}</a>` : ''}</div>
  <ul class="rail">
${shown.map(card).join('\n')}${more}
  </ul>
</section>`;
}

function row(e: DbEvent): string {
  const t = eventTime(e);
  const img = e.image_url
    ? `<img src="${escapeHtml(optimizedImage(e.image_url, 320))}" alt="" width="48" height="48" loading="lazy">`
    : '';
  return `<li><a href="/event/${escapeHtml(e.event_id)}">
  <span class="t">${t ?? ''}</span>
  <span class="b"><span class="n">${escapeHtml(e.name)}</span>${e.venue_name ? `<span class="p">${escapeHtml(e.venue_name)}</span>` : ''}</span>
  ${img}
</a></li>`;
}

function dayList(events: DbEvent[], keyByDate: Map<string, KeyDate[]>): string {
  const days = new Map<string, DbEvent[]>();
  for (const e of events) {
    const d = e.date_time.slice(0, 10);
    days.set(d, [...(days.get(d) ?? []), e]);
  }
  return [...days]
    .map(([date, list]) => {
      const keys = keyByDate.get(date);
      const tag = keys
        ? `<span class="k">${escapeHtml(joinSv(keys.map((k, i) => (i === 0 ? k.name : k.name.toLowerCase()))))}</span>`
        : '';
      return `<div class="day">
  <h2><span>${escapeHtml(capitalize(svDateLabel(date)))}</span>${tag}</h2>
  <ul>
${list.map(row).join('\n')}
  </ul>
</div>`;
    })
    .join('\n');
}

function newsletterHtml(season: Season, status: string | undefined): string {
  const messages: Record<string, [string, string]> = {
    ok: ['ok', 'Tack! Nu är du anmäld till nyhetsbrevet.'],
    finns: ['err', 'Den e-postadressen är redan anmäld.'],
    ogiltig: ['err', 'Fyll i namn och en giltig e-postadress.'],
    fel: ['err', 'Något gick fel. Försök igen om en stund.'],
  };
  const msg = status ? messages[status] : undefined;
  return `<section class="box nl" id="nyhetsbrev">
  <h2>${escapeHtml(season.newsletterTitle)}</h2>
  <p class="muted">Vi skickar nyhetsbrev med det som händer i Varberg. Du kan avsluta när du vill.</p>
  <form id="nl-form" action="/api/nyhetsbrev" method="post">
    <input type="hidden" name="tillbaka" value="/${season.slug}">
    <div class="hp" aria-hidden="true"><label for="nl-web">Lämna tomt</label><input id="nl-web" name="website" tabindex="-1" autocomplete="off"></div>
    <label for="nl-namn">Förnamn</label>
    <input id="nl-namn" name="namn" autocomplete="given-name" required minlength="2" maxlength="100">
    <label for="nl-epost">E-postadress</label>
    <input id="nl-epost" name="epost" type="email" autocomplete="email" placeholder="namn@exempel.se" required>
    <button type="submit">Prenumerera</button>
    <p id="nl-msg" class="nl-msg${msg ? ' ' + msg[0] : ''}" role="status">${msg ? escapeHtml(msg[1]) : ''}</p>
  </form>
</section>
<script>
(function () {
  var f = document.getElementById('nl-form');
  if (!f || !window.fetch) return;
  f.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var msg = document.getElementById('nl-msg');
    var btn = f.querySelector('button');
    var val = function (n) { return f.elements.namedItem(n).value; };
    btn.disabled = true;
    fetch(f.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ namn: val('namn'), epost: val('epost'), website: val('website') })
    }).then(function (r) { return r.json(); }).then(function (j) {
      msg.textContent = j.message;
      msg.className = 'nl-msg ' + (j.ok ? 'ok' : 'err');
      if (j.ok) f.reset();
    }).catch(function () {
      msg.textContent = 'Något gick fel. Försök igen om en stund.';
      msg.className = 'nl-msg err';
    }).then(function () { btn.disabled = false; });
  });
})();
</script>`;
}

const CSS = `
:root { --sand:#F7F2EA; --sand-deep:#EEE4D3; --ink:#10214B; --ink-soft:#4A566B; --navy:#0B1B3A; --sea:#0F5AA6; --sea-dark:#0C4A8A; --sea-light:#DCE9F7; --poppy:#B84A14; --poppy-light:#FBE3D6; --border:#E2D8C7; --line:#EFE8DC; }
* { box-sizing:border-box; }
body { margin:0; font-family:'Poppins',system-ui,sans-serif; background:var(--sand); color:var(--ink); line-height:1.5; -webkit-text-size-adjust:100%; }
a { color:var(--sea); }
a:hover { color:var(--sea-dark); }
.wrap { max-width:56rem; margin:0 auto; }
header.top { background:#fff; border-bottom:1px solid var(--border); }
header.top .wrap { height:56px; padding:0 16px; display:flex; align-items:center; justify-content:space-between; gap:16px; }
header.top img { height:26px; width:auto; display:block; }
header.top nav { display:flex; gap:20px; }
header.top nav a { font-size:14px; font-weight:600; text-decoration:none; padding:12px 0; }
.hero { display:block; width:100%; height:200px; object-fit:cover; object-position:center 40%; }
.lead { padding:20px 16px 8px; }
h1 { margin:0 0 6px; font-size:32px; line-height:1.1; font-weight:700; letter-spacing:-.01em; }
.lead p { margin:0; font-size:16px; }
.lead a { font-weight:600; }
.muted { color:var(--ink-soft); }
.tiles { list-style:none; margin:12px 16px 0; padding:0; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
.tiles a { display:flex; flex-direction:column; height:100%; background:#fff; border:1px solid var(--border); border-radius:12px; overflow:hidden; color:var(--ink); text-decoration:none; }
.tiles a:hover { border-color:var(--sea); }
.tiles img, .tiles .ph { display:block; width:100%; height:104px; object-fit:cover; background:var(--sand-deep); }
.tiles .tb { padding:10px 12px 12px; display:flex; flex-direction:column; gap:2px; }
.tiles .tl { font-size:16px; font-weight:600; line-height:1.3; }
.tiles .tc { font-size:13px; color:var(--ink-soft); }
.rail-s { margin-top:32px; scroll-margin-top:12px; }
.rail-h { padding:0 16px 12px; display:flex; justify-content:space-between; align-items:baseline; gap:12px; }
.rail-h h2 { margin:0; font-size:20px; font-weight:700; line-height:1.3; }
.rail-h a { flex:none; font-size:14px; font-weight:600; text-decoration:none; padding:8px 0; }
.rail { list-style:none; margin:0; padding:0 16px 8px; display:flex; gap:12px; overflow-x:auto; scroll-snap-type:x mandatory; scroll-padding-inline:16px; scrollbar-width:thin; overscroll-behavior-x:contain; }
.rail::after { content:''; flex:none; width:4px; }
.rail > li { flex:none; width:250px; scroll-snap-align:start; }
.card { display:flex; flex-direction:column; height:100%; background:#fff; border:1px solid var(--border); border-radius:12px; overflow:hidden; color:var(--ink); text-decoration:none; }
.card:hover { border-color:var(--sea); }
.card img, .card .db { display:block; width:100%; height:140px; object-fit:cover; }
.db { background:var(--sand-deep); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; font-size:13px; color:var(--ink-soft); }
.db span:first-child { font-weight:600; color:var(--poppy); }
.db .dd { font-size:40px; line-height:1; font-weight:700; color:var(--ink); }
.cb { padding:12px; display:flex; flex-direction:column; gap:4px; }
.cb .w { font-size:13px; font-weight:600; color:var(--poppy); }
.cb .n { font-size:15px; font-weight:600; line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.cb .p { font-size:13px; color:var(--ink-soft); }
.rail > li.more-card { width:160px; }
.more-card a { height:100%; min-height:220px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; background:var(--sea-light); color:var(--sea-dark); border-radius:12px; font-size:15px; font-weight:600; text-decoration:none; text-align:center; padding:12px; }
.more-card a:hover { background:#CFE0F3; }
.prev { margin-top:40px; padding-top:8px; border-top:1px solid var(--border); }
.prev .note { margin:0 16px 4px; font-size:15px; }
.prev .card { opacity:.92; }
.all { display:block; margin:32px 16px 0; text-align:center; text-decoration:none; font-size:15px; font-weight:600; color:var(--sea-dark); background:var(--sea-light); border-radius:10px; padding:14px; }
.all:hover { background:#CFE0F3; }
.back { display:inline-block; margin:16px 16px 0; padding:8px 0; font-size:15px; font-weight:600; text-decoration:none; }
.chips { display:flex; gap:8px; overflow-x:auto; padding:12px 16px 4px; scrollbar-width:none; }
.chips::-webkit-scrollbar { display:none; }
.chips a { flex:none; font-size:14px; font-weight:500; padding:9px 14px; border-radius:999px; background:#fff; border:1px solid var(--border); color:var(--ink); text-decoration:none; }
.chips a[aria-current] { background:var(--sea-light); border-color:var(--sea-light); color:var(--sea-dark); font-weight:600; }
.day h2 { margin:0; padding:20px 16px 8px; font-size:16px; font-weight:700; display:flex; justify-content:space-between; align-items:center; gap:8px; }
.day .k { flex:none; font-size:12px; font-weight:600; color:var(--poppy); background:var(--poppy-light); border-radius:999px; padding:4px 10px; }
.day ul { list-style:none; margin:0 16px; padding:0; background:#fff; border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.day li + li { border-top:1px solid var(--line); }
.day li a { display:flex; align-items:center; gap:12px; padding:12px 14px; color:var(--ink); text-decoration:none; }
.day li a:hover .n { color:var(--sea); }
.day .t { flex:none; width:44px; font-size:15px; font-weight:700; }
.day .b { flex:1; min-width:0; display:flex; flex-direction:column; gap:1px; }
.day .n { font-size:15px; font-weight:600; line-height:1.35; }
.day .p { font-size:13px; color:var(--ink-soft); }
.day li img { flex:none; width:48px; height:48px; border-radius:8px; object-fit:cover; background:var(--sand-deep); }
.box { margin:40px 16px 0; background:#fff; border:1px solid var(--border); border-radius:12px; padding:20px; }
.box h2 { margin:0 0 6px; font-size:18px; font-weight:700; }
.box p { margin:0 0 12px; font-size:15px; }
.box.empty { margin-top:16px; }
.box.empty p { margin:0; }
.nl { background:var(--sea-light); border-color:var(--sea-light); }
.nl form { display:flex; flex-direction:column; gap:6px; }
.nl label { font-size:14px; font-weight:600; margin-top:6px; }
.nl input { height:48px; border:1px solid #A9C3E2; border-radius:10px; padding:0 14px; font:inherit; font-size:16px; color:var(--ink); background:#fff; }
.nl input:focus { outline:2px solid var(--sea); outline-offset:1px; border-color:var(--sea); }
.nl button { margin-top:10px; height:48px; border:0; border-radius:10px; background:var(--sea); color:#fff; font:inherit; font-size:16px; font-weight:600; cursor:pointer; }
.nl button:hover { background:var(--sea-dark); }
.nl button:disabled { opacity:.6; }
.nl .muted { color:#2A3655; }
.nl-msg { margin:6px 0 0; font-size:14px; font-weight:500; }
.nl-msg.ok { color:#1B6E4B; }
.nl-msg.err { color:#A3321A; }
.hp { position:absolute; left:-9999px; }
.faq { margin:40px 16px 0; }
.faq h2 { margin:0 0 8px; font-size:18px; font-weight:700; }
.faq details { border-bottom:1px solid var(--border); }
.faq details:first-of-type { border-top:1px solid var(--border); }
.faq summary { min-height:56px; display:flex; justify-content:space-between; align-items:center; gap:12px; padding:12px 0; font-size:15px; font-weight:600; cursor:pointer; list-style:none; }
.faq summary::-webkit-details-marker { display:none; }
.faq summary::after { content:'+'; flex:none; font-size:20px; font-weight:500; color:var(--sea); }
.faq details[open] summary::after { content:'–'; }
.faq details p { margin:0 0 16px; font-size:15px; color:var(--ink-soft); }
.more { margin:32px 16px 0; }
.more h2 { margin:0 0 10px; font-size:16px; font-weight:700; }
.more div { display:flex; flex-wrap:wrap; gap:8px; }
.more a { font-size:14px; font-weight:500; padding:9px 14px; border-radius:999px; background:#fff; border:1px solid var(--border); color:var(--ink); text-decoration:none; }
.more a:hover { border-color:var(--sea); color:var(--sea); }
@media (min-width:640px) {
  .hero { height:300px; margin-top:24px; border-radius:12px; }
  .hero-wrap { padding:0 16px; }
  h1 { font-size:42px; }
  .lead { padding-top:28px; }
  .tiles { grid-template-columns:repeat(4,minmax(0,1fr)); }
}
`;

function shell(season: Season, opts: { title: string; description: string; robots?: string; jsonLd?: string; main: string }): string {
  const canonical = `${SITE}/${season.slug}`;
  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(opts.title)}</title>
<meta name="description" content="${escapeHtml(opts.description)}">
${opts.robots ? `<meta name="robots" content="${opts.robots}">\n` : ''}<link rel="canonical" href="${canonical}">
<link rel="icon" href="/favicon_light.png" media="(prefers-color-scheme: light)">
<link rel="icon" href="/favicon_dark.png" media="(prefers-color-scheme: dark)">
<meta property="og:title" content="${escapeHtml(opts.title)}">
<meta property="og:description" content="${escapeHtml(opts.description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}${season.hero}">
<meta property="og:locale" content="sv_SE">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
${opts.jsonLd ?? ''}
<style>${CSS}
${SITE_FOOTER_CSS}</style>
</head>
<body>
<header class="top"><div class="wrap">
  <a href="/"><img src="/logo.png" alt="ivarberg.nu" width="120" height="26"></a>
  <nav><a href="/">Alla evenemang</a><a href="/tips">Tipsa oss</a></nav>
</div></header>
<main class="wrap">
${opts.main}
</main>
${siteFooterHtml(`/${season.slug}#nyhetsbrev`)}
</body>
</html>`;
}

// ---------- Data ----------

interface Edition {
  year: number;
  window: DateWindow;
  events: DbEvent[]; // alla förekomster (serier en gång per dag)
  unique: DbEvent[];
  rails: Map<string, DbEvent[]>; // unika per rad
}

function toEdition(season: Season, year: number, window: DateWindow, all: DbEvent[]): Edition {
  const events = all.filter((e) => !season.include || season.include(e));
  const unique = dedupeByName(events);
  const rails = new Map<string, DbEvent[]>();
  for (const e of unique) {
    const k = assignRail(season, e);
    rails.set(k, [...(rails.get(k) ?? []), e]);
  }
  return { year, window, events, unique, rails };
}

function keyByDate(season: Season, year: number): Map<string, KeyDate[]> {
  const m = new Map<string, KeyDate[]>();
  for (const k of season.keyDates(year)) m.set(k.date, [...(m.get(k.date) ?? []), k]);
  return m;
}

function viewHref(season: Season, key: string): string {
  return `/${season.slug}?visa=${key}`;
}

// ---------- Sidorna ----------

export function buildSeasonPage(season: Season, cur: Edition, prev: Edition | null, newsletterStatus?: string): string {
  const { year, unique } = cur;
  const n = unique.length;
  const title = `${season.title(year)} | ivarberg.nu`;
  const description = season.description(year, n);

  const present = season.rails
    .map((r) => ({ ...r, list: cur.rails.get(r.key) ?? [] }))
    .filter((r) => r.list.length > 0);

  const tiles = present
    .filter((r) => r.tile)
    .slice(0, 4)
    .map((r) => {
      const withImg = r.list.find((e) => e.image_url);
      const img = withImg
        ? `<img src="${escapeHtml(optimizedImage(withImg.image_url, 480))}" alt="" width="200" height="104" loading="lazy">`
        : '<span class="ph"></span>';
      return `<li><a href="#${r.key}">${img}<span class="tb"><span class="tl">${escapeHtml(r.tile!)}</span><span class="tc">${r.list.length} evenemang</span></span></a></li>`;
    });

  const rails = present.map((r) => rail(r.key, r.title, r.list, viewHref(season, r.key))).join('\n');

  const prevHtml =
    prev && prev.unique.length > 0
      ? `<section class="prev">
${rail('forra', `Så såg det ut ${prev.year}`, prev.unique, viewHref(season, 'forra'))}
  <p class="note muted">${n > 0 ? 'Fler evenemang för i år läggs upp löpande.' : `Programmet för ${year} är inte klart än. Här är förra årets evenemang som inspiration.`}</p>
</section>`
      : '';

  const faq = season.faq({
    year,
    window: cur.window,
    rails: cur.rails,
    prevYear: year - 1,
    prevRails: prev?.rails ?? new Map(),
  } satisfies FaqCtx);

  const lead = season.lead(year, n);
  const others = SEASONS.filter((s) => s.slug !== season.slug);

  const main = `<div class="hero-wrap"><img class="hero" src="${season.hero}" alt="${escapeHtml(season.heroAlt)}" width="1920" height="1154"></div>
<section class="lead">
  <h1>${escapeHtml(season.name)} ${year}</h1>
  <p class="muted">${escapeHtml(lead)}${n > 0 ? ` <a href="${viewHref(season, 'alla')}">Se hela kalendern</a>.` : ''}</p>
</section>
${
  n === 0
    ? `<div class="box empty"><p>${escapeHtml(season.emptyNote)} Känner du till något som saknas? <a href="/tips">Tipsa oss</a>.</p></div>`
    : `${tiles.length >= 2 ? `<ul class="tiles">\n${tiles.join('\n')}\n</ul>` : ''}
${rails}
<a class="all" href="${viewHref(season, 'alla')}">Se hela kalendern dag för dag</a>`
}
${prevHtml}
${newsletterHtml(season, newsletterStatus)}
${
  faq.length > 0
    ? `<section class="faq">
  <h2>Vanliga frågor</h2>
${faq.map((f) => `  <details><summary>${escapeHtml(f.q)}</summary><p>${f.aHtml}</p></details>`).join('\n')}
</section>`
    : ''
}
<nav class="more" aria-label="Fler säsonger">
  <h2>Mer i Varberg året runt</h2>
  <div>${others.map((s) => `<a href="/${s.slug}">${escapeHtml(s.label)}</a>`).join('')}<a href="/i-helgen">I helgen</a><a href="/varberg-kalender">Kalendern</a></div>
</nav>`;

  const canonical = `${SITE}/${season.slug}`;
  const jsonLd = pageJsonLd({
    url: canonical,
    title,
    description,
    pageType: 'CollectionPage',
    breadcrumbs: [
      { name: 'ivarberg.nu', item: SITE },
      { name: `${season.name} ${year}`, item: canonical },
    ],
    events: unique, // bara årets kommande – aldrig förra årets i schemat
    faq: faq.map(({ q, a }) => ({ q, a })),
  });

  return shell(season, { title, description, jsonLd, main });
}

// "Visa alla": en rad (eller hela kalendern, eller förra året) dag för dag.
// noindex – innehållet finns redan på huvudsidan och i eventsidorna.
export function buildSeasonList(season: Season, cur: Edition, prev: Edition | null, key: string): string {
  const isPrev = key === 'forra';
  const ed = isPrev && prev ? prev : cur;
  const railDef = season.rails.find((r) => r.key === key);
  const list = railDef ? ed.events.filter((e) => assignRail(season, e) === key) : ed.events;
  const count = railDef ? (ed.rails.get(key) ?? []).length : ed.unique.length;
  const heading = isPrev
    ? `${season.name} ${ed.year}`
    : railDef
      ? `${railDef.title} – ${season.name} ${ed.year}`
      : `${season.name} ${ed.year} dag för dag`;

  const chips = [
    { key: 'alla', label: 'Alla' },
    ...season.rails.filter((r) => (cur.rails.get(r.key) ?? []).length > 0).map((r) => ({ key: r.key, label: r.tile ?? r.title })),
    ...(prev && prev.unique.length > 0 ? [{ key: 'forra', label: `Förra året (${prev.year})` }] : []),
  ]
    .map((c) => `<a href="${viewHref(season, c.key)}"${c.key === key ? ' aria-current="page"' : ''}>${escapeHtml(c.label)}</a>`)
    .join('');

  const main = `<a class="back" href="/${season.slug}">← ${escapeHtml(season.name)} ${cur.year}</a>
<section class="lead">
  <h1>${escapeHtml(heading)}</h1>
  <p class="muted">${count} evenemang, dag för dag.${isPrev ? ' Förra årets program, som inspiration.' : ''}</p>
</section>
<nav class="chips" aria-label="Visa">${chips}</nav>
${list.length > 0 ? dayList(list, keyByDate(season, ed.year)) : '<div class="box empty"><p>Inget inlagt här än.</p></div>'}
<a class="all" href="/${season.slug}">Tillbaka till ${escapeHtml(season.name)}</a>`;

  return shell(season, {
    title: `${heading} | ivarberg.nu`,
    description: `${heading}: ${count} evenemang med datum, tid och plats.`,
    robots: 'noindex, follow',
    main,
  });
}

// ---------- Hanteraren ----------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = typeof req.query.slug === 'string' ? req.query.slug : '';
  const season = findSeason(slug);
  if (!season) return res.status(404).send('Not found');

  try {
    const today = stockholmToday();
    const ed = currentEdition(season, today);
    if (!ed) {
      res.setHeader('Cache-Control', 'no-store');
      return res.redirect(302, '/');
    }
    const visa = typeof req.query.visa === 'string' ? req.query.visa : '';
    if (visa && visa !== 'alla' && visa !== 'forra' && !season.rails.some((r) => r.key === visa)) {
      return res.redirect(301, `/${season.slug}`);
    }

    const from = today > ed.window.from ? today : ed.window.from;
    const rows = await fetchEvents({ from, to: ed.window.to, limit: 1000 });
    if (rows === null) {
      res.setHeader('Cache-Control', 'no-store');
      return res.redirect(302, '/');
    }
    const cur = toEdition(season, ed.year, ed.window, rows);

    // Förra årets program när årets ännu är tunt (före säsongen)
    let prev: Edition | null = null;
    const prevWindow = season.window(ed.year - 1);
    if (prevWindow && (cur.unique.length < PREV_THRESHOLD || visa === 'forra')) {
      const prevRows = await fetchEvents({ from: prevWindow.from, to: prevWindow.to, limit: 1000 });
      if (prevRows) prev = toEdition(season, ed.year - 1, prevWindow, prevRows);
    }

    const status = typeof req.query.nyhetsbrev === 'string' ? req.query.nyhetsbrev : undefined;
    const html = visa ? buildSeasonList(season, cur, prev, visa) : buildSeasonPage(season, cur, prev, status);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', status ? 'no-store' : 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);
  } catch (error) {
    console.error(`Error rendering season page ${slug}:`, error);
    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(302, '/');
  }
}
