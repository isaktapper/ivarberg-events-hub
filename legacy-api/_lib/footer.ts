// Sajtens footer – en enda källa för länkarna, så att startsidans React-footer
// (src/components/Footer.tsx) och de serverrenderade sidornas HTML-footer
// (render.ts, sasong.ts) alltid visar samma sak.
//
// Design: varumärke + nyhetsbrev till vänster, fyra länkgrupper till höger,
// en lugn bottenrad (copyright, Om oss, Tipsa oss, kontakt, Instagram,
// "En del av inu"). Mörk navy-zon, inga skuggor eller gradienter.

import { SEASONS } from './seasons';
import { escapeHtml } from './events';
import { INSTAGRAM_URL } from '../../src/lib/constants';

export interface FooterLink {
  href: string;
  label: string;
  external?: boolean;
}

export const FOOTER_TAGLINE = 'Allt som händer i Varberg, på ett ställe.';
export const FOOTER_ADDRESS = 'Fästningsgatan 5, 432 44 Varberg';

export const FOOTER_GROUPS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Hitta evenemang',
    links: [
      { href: '/', label: 'Alla evenemang' },
      { href: '/idag', label: 'Idag' },
      { href: '/i-helgen', label: 'I helgen' },
      { href: '/i-veckan', label: 'I veckan' },
      { href: '/varberg-kalender', label: 'Kalendern' },
      { href: '/evenemang-varberg', label: 'Evenemang i Varberg' },
      { href: '/att-gora-i-varberg', label: 'Att göra i Varberg' },
    ],
  },
  {
    title: 'Året i Varberg',
    links: SEASONS.map((s) => ({ href: `/${s.slug}`, label: s.name })),
  },
  {
    title: 'Kategorier',
    links: [
      { href: '/kategori/scen', label: 'Scen' },
      { href: '/kategori/barn-familj', label: 'Barn & Familj' },
      { href: '/kategori/mat-dryck', label: 'Mat & Dryck' },
      { href: '/kategori/sport', label: 'Sport' },
      { href: '/kategori/marknader', label: 'Marknader' },
      { href: '/kategori/nattliv', label: 'Nattliv' },
      { href: '/kategori/utstallningar', label: 'Utställningar' },
    ],
  },
  {
    title: 'Områden',
    links: [
      { href: '/omrade/centrala-varberg', label: 'Centrala Varberg' },
      { href: '/omrade/apelviken', label: 'Apelviken' },
      { href: '/omrade/getteron', label: 'Getterön' },
      { href: '/omrade/traslovslage', label: 'Träslövsläge' },
      { href: '/omrade/tvaaker', label: 'Tvååker' },
      { href: '/omrade/bua', label: 'Bua' },
    ],
  },
];

export const FOOTER_BOTTOM_LINKS: FooterLink[] = [
  { href: '/om-oss', label: 'Om oss' },
  { href: '/tips', label: 'Tipsa oss' },
  { href: 'mailto:info@ivarberg.nu', label: 'info@ivarberg.nu' },
  { href: INSTAGRAM_URL, label: 'Instagram', external: true },
];

export const INU_URL = 'https://www.inugroup.se/';
export const INU_LABEL = 'En del av inu – motorn bakom stadens kulturliv';
// inu:s ordmärke (från inugroup.se): staplarna följer textfärgen, fyrkanten är alltid limegrön
export const INU_PATH = 'M6.5 30V90M33.5 90V55a20 20 0 0 1 40 0V90M100.5 30v35a20 20 0 0 0 40 0V30';
export const INU_LIME = '#C6F135';

// ---------- HTML för de serverrenderade sidorna ----------

export const SITE_FOOTER_CSS = `
.sf { margin-top:64px; background:#0B1B3A; color:#F7F2EA; font-family:'Poppins',system-ui,sans-serif; line-height:1.5; }
.sf * { box-sizing:border-box; }
.sf-in { max-width:72rem; margin:0 auto; padding:48px 16px 28px; }
.sf-top { display:grid; grid-template-columns:minmax(0,1fr); gap:40px; }
.sf .sf-brand .sf-name { margin:0 0 6px; font-size:20px; font-weight:700; color:#fff; letter-spacing:-.01em; }
.sf .sf-brand p { margin:0; font-size:15px; color:#C3CCDD; }
.sf .sf-brand .sf-addr { margin-top:12px; font-size:14px; }
.sf .sf-nl { display:inline-block; margin-top:20px; padding:12px 20px; border-radius:999px; background:#7FD1C8; color:#0B1B3A; font-size:15px; font-weight:600; text-decoration:none; white-space:nowrap; }
.sf .sf-nl:hover { background:#A3E0D9; color:#0B1B3A; }
.sf-groups { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:32px 24px; }
.sf .sf-h { margin:0 0 8px; padding:0; text-align:left; font-size:14px; line-height:1.4; font-weight:600; color:#fff; }
.sf ul { list-style:none; margin:0; padding:0; }
.sf-groups a { display:inline-block; padding:5px 0; font-size:14px; color:#C3CCDD; text-decoration:none; }
.sf a:hover { color:#7FD1C8; }
.sf-bot { margin-top:40px; padding-top:20px; border-top:1px solid rgba(247,242,234,.15); display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:12px 24px; font-size:14px; color:#C3CCDD; }
.sf-bot ul { display:flex; flex-wrap:wrap; align-items:center; gap:0 20px; }
.sf-bot a { display:inline-block; padding:6px 0; color:#C3CCDD; text-decoration:none; }
.sf .sf-inu { display:inline-flex; align-items:center; gap:6px; color:#fff; font-weight:500; text-decoration:none; padding:6px 0; }
.sf .sf-inu svg { display:block; }
@media (min-width:768px) { .sf-groups { grid-template-columns:repeat(4,minmax(0,1fr)); } }
@media (min-width:1024px) { .sf-in { padding:56px 24px 28px; } .sf-top { grid-template-columns:minmax(0,1.25fr) minmax(0,3fr); gap:56px; } }
`;

function linkHtml(l: FooterLink): string {
  const ext = l.external ? ' target="_blank" rel="noopener noreferrer"' : '';
  return `<a href="${escapeHtml(l.href)}"${ext}>${escapeHtml(l.label)}</a>`;
}

/** @param newsletterHref vart Nyhetsbrev-knappen leder (startsidan öppnar dialogen via ?nyhetsbrev=1) */
export function siteFooterHtml(newsletterHref = '/?nyhetsbrev=1'): string {
  return `<footer class="sf"><div class="sf-in">
  <div class="sf-top">
    <div class="sf-brand">
      <p class="sf-name">ivarberg.nu</p>
      <p>${escapeHtml(FOOTER_TAGLINE)}</p>
      <p class="sf-addr">${escapeHtml(FOOTER_ADDRESS)}</p>
      <a class="sf-nl" href="${escapeHtml(newsletterHref)}">Få nyhetsbrevet</a>
    </div>
    <div class="sf-groups">
${FOOTER_GROUPS.map(
  (g) => `      <nav aria-label="${escapeHtml(g.title)}">
        <h2 class="sf-h">${escapeHtml(g.title)}</h2>
        <ul>
${g.links.map((l) => `          <li>${linkHtml(l)}</li>`).join('\n')}
        </ul>
      </nav>`
).join('\n')}
    </div>
  </div>
  <div class="sf-bot">
    <ul>
      <li>&copy; ${new Date().getFullYear()} ivarberg.nu</li>
${FOOTER_BOTTOM_LINKS.map((l) => `      <li>${linkHtml(l)}</li>`).join('\n')}
    </ul>
    <a class="sf-inu" href="${INU_URL}" rel="noopener" aria-label="${escapeHtml(INU_LABEL)}">En del av <svg viewBox="0 7 147 85" width="26" height="15" aria-hidden="true" focusable="false"><path d="${INU_PATH}" fill="none" stroke="currentColor" stroke-width="13"/><rect x="0" y="9" width="13" height="13" fill="${INU_LIME}"/></svg></a>
  </div>
</div></footer>`;
}
