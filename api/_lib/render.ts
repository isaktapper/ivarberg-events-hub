import { SITE, PERIOD_PILLS, CATEGORIES, AREAS } from './constants';
import type { DbEvent } from './supabase';
import type { Recommendation } from './recommendations';
import { escapeHtml, plainText, eventTime, eventDayLabel, mainCategory } from './events';
import { svDateLabel } from './dates';

// HTML-rendering för de serverrenderade sidorna. Layout, CSS och kort/list-
// komponenter flyttade från api/landing.ts; layout() är generaliserad så att
// flera sidtyper (period, guide, kategori, område) delar samma skal.

// Inline-SVG:er (lucide-ikonerna som SPA:n använder)
export const ICONS = {
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
};

export function imageAlt(e: DbEvent): string {
  return `${e.name} - ${mainCategory(e)} evenemang i Varberg`;
}

export function eventImage(e: DbEvent): string {
  return e.image_url ? escapeHtml(e.image_url) : '/placeholder.svg';
}

// Grid-kort som speglar EventCard.tsx (bild överst, badge, ikon-cirklar, Läs mer)
export function highlightCard(e: DbEvent): string {
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
export function eventRow(e: DbEvent): string {
  const t = eventTime(e);
  const date = e.date_time.slice(0, 10);
  // Saknad tid (kl 00:00 i källan) utelämnas - vi påstår inte "Hela dagen"
  const timeLabel = t ? `${date} - ${t.replace('.', ':')}` : date;
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

const CSS = `  /* Speglar startsidans design: Hero.tsx, EventCard.tsx, EventListItem.tsx, Footer.tsx, src/index.css */
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
  /* Period-piller i glas-stil, som startsidans snabbfilter */
  .hero-pills { display:grid; grid-template-columns:repeat(2,1fr); gap:.75rem; max-width:20rem; margin:2.5rem auto 0; }
  @media (min-width:640px) { .hero-pills { display:flex; justify-content:center; max-width:none; gap:1rem; } }
  .hero-pill { display:block; padding:.8rem 1.6rem; border-radius:9999px; font-size:.95rem; font-weight:500; text-decoration:none; color:var(--navy); background:rgba(215,235,255,.45); border:1px solid rgba(255,255,255,.7); backdrop-filter:blur(16px); box-shadow:0 8px 32px 0 rgba(31,38,135,.15); transition:all .2s; text-align:center; }
  .hero-pill:hover { background:rgba(74,144,226,.9); color:#fff; transform:scale(1.02); }
  .hero-pill.active { background:rgba(74,144,226,.9); color:#fff; border-color:rgba(255,255,255,.9); }
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
  /* Kurerade rekommendationskort */
  .rec-grid { display:grid; grid-template-columns:1fr; gap:1.5rem; max-width:64rem; margin:0 auto; }
  @media (min-width:640px) { .rec-grid { grid-template-columns:repeat(2,1fr); } }
  @media (min-width:1024px) { .rec-grid { grid-template-columns:repeat(3,1fr); } }
  .rec-card { display:flex; flex-direction:column; background:rgba(255,255,255,.9); backdrop-filter:blur(4px); border:1px solid rgba(255,255,255,.5); border-radius:1rem; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.06); text-decoration:none; color:inherit; transition:all .3s; }
  a.rec-card:hover { box-shadow:0 8px 32px hsl(217 91% 42% / .16); transform:translateY(-4px); background:rgba(255,255,255,.95); }
  .rec-img { position:relative; height:10rem; overflow:hidden; }
  .rec-img img { width:100%; height:100%; object-fit:cover; }
  .rec-fallback { display:flex; align-items:center; justify-content:center; height:10rem; font-size:3.5rem; background:linear-gradient(135deg,hsl(217 91% 42% / .12),hsl(210 100% 56% / .25)); }
  .rec-body { padding:1.25rem 1.5rem 1.5rem; }
  .rec-body h3 { color:var(--navy); font-size:1.1rem; font-weight:700; line-height:1.35; margin-bottom:.5rem; }
  .rec-blurb { font-size:.88rem; color:#4b5563; }
  .rec-more { display:inline-block; margin-top:.75rem; color:var(--accent); font-weight:600; font-size:.85rem; }
  /* Kategorirutnät */
  .tile-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:.9rem; max-width:64rem; margin:0 auto; }
  @media (min-width:640px) { .tile-grid { grid-template-columns:repeat(3,1fr); } }
  @media (min-width:1024px) { .tile-grid { grid-template-columns:repeat(4,1fr); } }
  .tile { display:flex; flex-direction:column; align-items:center; gap:.35rem; background:rgba(255,255,255,.9); border:1px solid rgba(255,255,255,.5); border-radius:1rem; box-shadow:0 2px 8px rgba(0,0,0,.06); padding:1.25rem 1rem; text-decoration:none; text-align:center; transition:all .2s; }
  .tile:hover { box-shadow:0 8px 32px hsl(217 91% 42% / .16); transform:translateY(-2px); }
  .tile-emoji { font-size:1.9rem; line-height:1; }
  .tile-name { color:var(--navy); font-weight:700; font-size:.95rem; }
  .tile-count { color:var(--muted); font-size:.78rem; }
  /* Chips (områden, kategorier, perioder i innehållet) */
  .chip-row { display:flex; flex-wrap:wrap; justify-content:center; gap:.6rem; max-width:64rem; margin:0 auto; }
  .chip { display:inline-block; padding:.5rem 1.1rem; border-radius:9999px; font-size:.88rem; font-weight:500; text-decoration:none; color:var(--navy); background:#fff; border:1px solid var(--border); transition:all .2s; }
  .chip:hover { background:var(--accent); color:#fff; border-color:var(--accent); }
  .chip.active { background:var(--navy); color:#fff; border-color:var(--navy); }
  /* Prosa-kort (guide-sektioner) */
  .prose-card { max-width:52rem; margin:0 auto; background:rgba(255,255,255,.9); backdrop-filter:blur(4px); border:1px solid rgba(255,255,255,.5); border-radius:1rem; box-shadow:0 2px 12px hsl(217 91% 42% / .1); padding:1.75rem 2rem; }
  .prose-card h2 { text-align:left; font-size:1.4rem; margin:1.5rem 0 .75rem; }
  .prose-card h2:first-child { margin-top:0; }
  .prose-card h3 { color:var(--navy); font-size:1.05rem; font-weight:600; margin:1.25rem 0 .4rem; }
  .prose-card p { margin-bottom:.75rem; font-size:.95rem; }
  .prose-card ul { padding-left:1.25rem; }
  .prose-card li { margin-bottom:.5rem; font-size:.95rem; }
  .prose-card a { color:var(--accent); font-weight:600; text-decoration:none; }
  .prose-card a:hover { text-decoration:underline; }
  /* Dag-grupperad kalenderlista */
  .day-h3 { max-width:64rem; margin:2.25rem auto .9rem; color:var(--navy); font-size:1.15rem; font-weight:700; border-bottom:2px solid hsl(217 91% 42% / .15); padding-bottom:.4rem; }
  .day-h3 span { color:var(--muted); font-weight:500; font-size:.85rem; margin-left:.5rem; }`;

// Kurerade tipskort – bild eller gradient+emoji, länkar alltid internt
export function recommendationGrid(recs: Recommendation[], currentPath?: string): string {
  const cards = recs.map((r) => {
    const areaHref = r.areaSlug ? `/omrade/${r.areaSlug}` : null;
    const catHref = r.categorySlug ? `/kategori/${r.categorySlug}` : null;
    const href =
      areaHref && areaHref !== currentPath ? areaHref : catHref && catHref !== currentPath ? catHref : null;
    const img = r.imageUrl
      ? `<div class="rec-img"><img src="${escapeHtml(r.imageUrl)}" alt="${escapeHtml(r.name)}" loading="lazy" width="900" height="600"></div>`
      : `<div class="rec-fallback" aria-hidden="true">${r.emoji}</div>`;
    const body = `${img}
    <div class="rec-body">
      <h3>${escapeHtml(r.name)}</h3>
      <p class="rec-blurb">${escapeHtml(r.blurb)}</p>${
        href ? `\n      <span class="rec-more">Se mer i området →</span>` : ''
      }
    </div>`;
    return href
      ? `<a class="rec-card" href="${href}">\n    ${body}\n  </a>`
      : `<div class="rec-card">\n    ${body}\n  </div>`;
  });
  return `<div class="rec-grid">\n  ${cards.join('\n  ')}\n</div>`;
}

// Klickbart kategorirutnät med valfria live-antal
export function categoryTileGrid(counts?: Record<string, number>, currentSlug?: string): string {
  const tiles = CATEGORIES.filter((c) => c.slug !== currentSlug).map((c) => {
    const n = counts?.[c.name];
    return `<a class="tile" href="/kategori/${c.slug}">
    <span class="tile-emoji" aria-hidden="true">${c.emoji || '📅'}</span>
    <span class="tile-name">${escapeHtml(c.name)}</span>${
      n ? `\n    <span class="tile-count">${n} kommande</span>` : ''
    }
  </a>`;
  });
  return `<div class="tile-grid">\n  ${tiles.join('\n  ')}\n</div>`;
}

export function areaChipRow(currentSlug?: string): string {
  const chips = AREAS.map(
    (a) =>
      `<a class="chip${a.slug === currentSlug ? ' active' : ''}" href="/omrade/${a.slug}">${escapeHtml(a.name)}</a>`
  );
  return `<div class="chip-row">${chips.join('')}</div>`;
}

export function periodChipRow(): string {
  const chips = PERIOD_PILLS.map((p) => `<a class="chip" href="/${p.slug}">${escapeHtml(p.pill)}</a>`);
  return `<div class="chip-row">${chips.join('')}</div>`;
}

export function chipRow(items: { href: string; label: string }[]): string {
  return `<div class="chip-row">${items
    .map((i) => `<a class="chip" href="${i.href}">${escapeHtml(i.label)}</a>`)
    .join('')}</div>`;
}

export function proseSection(html: string): string {
  return `<section class="prose-card">\n${html}\n</section>`;
}

// Eventlista grupperad per dag – för kalendersidan
export function dayGroupedList(events: DbEvent[]): string {
  const byDay = new Map<string, DbEvent[]>();
  for (const e of events) {
    const day = e.date_time.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(e);
  }
  const parts: string[] = [];
  for (const [day, dayEvents] of byDay) {
    const label = svDateLabel(day);
    parts.push(
      `<h3 class="day-h3">${escapeHtml(label.charAt(0).toUpperCase() + label.slice(1))}<span>${
        dayEvents.length
      } evenemang</span></h3>
<ul class="events">
${dayEvents.map((e) => eventRow(e)).join('\n')}
</ul>`
    );
  }
  return parts.join('\n');
}

function heroPills(activeSlug?: string): string {
  return PERIOD_PILLS.map(
    (p) =>
      `      <a class="hero-pill${p.slug === activeSlug ? ' active' : ''}" href="/${p.slug}">${escapeHtml(p.pill)}</a>`
  ).join('\n');
}

function footerHtml(): string {
  return `<footer>
  <div class="footer-grid">
    <div>
      <h3>ivarberg.nu</h3>
      <p>Din kompletta guide till Varbergs puls. Missa aldrig ett evenemang igen!</p>
    </div>
    <div>
      <h4>Snabblänkar</h4>
      <ul>
        <li><a href="/">Alla evenemang</a></li>
        <li><a href="/idag">Idag</a></li>
        <li><a href="/i-helgen">I helgen</a></li>
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
        <li><a href="/kategori/scen">Scen</a></li>
        <li><a href="/kategori/sport">Sport</a></li>
        <li><a href="/kategori/mat-dryck">Mat &amp; Dryck</a></li>
        <li><a href="/kategori/barn-familj">Barn &amp; Familj</a></li>
        <li><a href="/kategori/nattliv">Nattliv</a></li>
        <li><a href="/kategori/utstallningar">Utställningar</a></li>
      </ul>
    </div>
    <div>
      <h4>Områden</h4>
      <ul>
        <li><a href="/omrade/centrala-varberg">Centrala Varberg</a></li>
        <li><a href="/omrade/apelviken">Apelviken</a></li>
        <li><a href="/omrade/getteron">Getterön</a></li>
        <li><a href="/omrade/traslovslage">Träslövsläge</a></li>
        <li><a href="/omrade/bua">Bua</a></li>
      </ul>
    </div>
    <div>
      <h4>Kontakt</h4>
      <ul>
        <li>info@ivarberg.nu</li>
        <li>Fästningsgatan 5, 432 44 Varberg</li>
        <li><a href="https://instagram.com/ivarberg.nu" target="_blank" rel="noopener noreferrer">Instagram</a></li>
      </ul>
    </div>
  </div>
  <div class="copyright">&copy; ${new Date().getFullYear()} ivarberg.nu - Alla rättigheter förbehållna</div>
</footer>`;
}

export interface LayoutOpts {
  title: string;
  metaDescription: string;
  canonical: string;
  jsonLd: string; // färdig <script type="application/ld+json">-tagg
  h1: string;
  heroSub: string; // färdig HTML-säker sträng (escapea själv vid behov)
  activePill?: string; // period-slug som ska markeras aktiv i hero-pillren
  main: string; // innerHTML för <main>
  extraCss?: string; // sidspecifik CSS, läggs efter bas-CSS:en
  robots?: string; // ex "noindex" – utelämnas normalt
}

export function layout(opts: LayoutOpts): string {
  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(opts.title)}</title>
<meta name="description" content="${escapeHtml(opts.metaDescription)}">
${opts.robots ? `<meta name="robots" content="${escapeHtml(opts.robots)}">\n` : ''}<link rel="canonical" href="${opts.canonical}">
<link rel="icon" href="/favicon_light.png" media="(prefers-color-scheme: light)">
<link rel="icon" href="/favicon_dark.png" media="(prefers-color-scheme: dark)">
<meta property="og:title" content="${escapeHtml(opts.title)}">
<meta property="og:description" content="${escapeHtml(opts.metaDescription)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${opts.canonical}">
<meta property="og:image" content="${SITE}/og-image.jpg">
<meta property="og:locale" content="sv_SE">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Outfit:wght@700;800&display=swap" rel="stylesheet">
${opts.jsonLd}
<style>
${CSS}${opts.extraCss ? '\n' + opts.extraCss : ''}
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
    <h1>${escapeHtml(opts.h1)}</h1>
    <p class="hero-sub">${opts.heroSub}</p>
    <nav class="hero-pills" aria-label="Välj period">
${heroPills(opts.activePill)}
    </nav>
  </div>
  <div class="wave"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="hsl(32 44% 96%)" fill-opacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg></div>
</section>
<main>
${opts.main}
</main>
${footerHtml()}
</body>
</html>`;
}
