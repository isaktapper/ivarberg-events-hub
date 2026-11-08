// Säsongsmotorn: en konfiguration per säsongssida (/jul-i-varberg,
// /sommar-i-varberg, lovsidorna …). Renderingen bor i legacy-api/sasong.ts.
//
// URL:erna är eviga (samma varje år) så att de samlar länkkraft år efter år;
// årtalet står i title/h1. Varje säsong har ett datumfönster per år, och
// sidan visar alltid nästa (eller pågående) upplaga. Innan programmet är
// publicerat visas förra årets evenemang som inspiration.
//
// Filen är ren (inga serveranrop) så att startsidans Hero kan använda
// seasonPromo() för att länka till rätt säsongssida.

import type { DbEvent } from './supabase';
import { addDays, weekdayIndex, svDateLabel } from './dates';
import { escapeHtml } from './events';

export interface DateWindow {
  from: string; // inkl, YYYY-MM-DD
  to: string; // exkl, YYYY-MM-DD
}

export interface KeyDate {
  date: string;
  name: string;
}

export interface Rail {
  key: string;
  title: string; // rubrik på raden, och i "Visa alla"
  tile?: string; // kort etikett på kategoriplattan (bara rader med tile får platta)
  priority?: number; // tilldelningsordning; lägre först (annars radens plats i listan)
  match: (e: DbEvent) => boolean;
}

export interface FaqEntry {
  q: string;
  a: string; // ren text (FAQPage-schema)
  aHtml: string;
}

export interface FaqCtx {
  year: number;
  window: DateWindow;
  rails: Map<string, DbEvent[]>; // årets, unika
  prevYear: number;
  prevRails: Map<string, DbEvent[]>; // förra årets, unika (tom om den inte hämtats)
}

export interface Season {
  slug: string; // URL utan snedstreck
  name: string; // "Jul i Varberg" – h1 är `${name} ${year}`
  label: string; // kort namn i länklistor: "Jul", "Sportlov"
  hero: string;
  heroAlt: string;
  window: (year: number) => DateWindow | null;
  include?: (e: DbEvent) => boolean; // utöver datumfönstret (standard: alla)
  rails: Rail[];
  keyDates: (year: number) => KeyDate[];
  title: (year: number) => string; // <title> utan " | ivarberg.nu"
  description: (year: number, n: number) => string;
  lead: (year: number, n: number) => string; // första meningen under h1 (ren text)
  emptyNote: string; // när årets program inte är publicerat än
  newsletterTitle: string;
  faq: (ctx: FaqCtx) => FaqEntry[];
  promoDays: number; // hur många dagar före fönstret startsidan länkar hit
}

// ---------- Datum ----------

const MONTHS = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];

export function isoWeek(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 3 - ((dt.getUTCDay() + 6) % 7)); // torsdagen i veckan
  const firstThursday = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4));
  firstThursday.setUTCDate(firstThursday.getUTCDate() + 3 - ((firstThursday.getUTCDay() + 6) % 7));
  return 1 + Math.round((dt.getTime() - firstThursday.getTime()) / (7 * 86400000));
}

// "22–26 februari" / "30 mars – 2 april"
export function rangeText(from: string, toIncl: string): string {
  const [, m1, d1] = from.split('-').map(Number);
  const [, m2, d2] = toIncl.split('-').map(Number);
  return m1 === m2 ? `${d1}–${d2} ${MONTHS[m2 - 1]}` : `${d1} ${MONTHS[m1 - 1]} – ${d2} ${MONTHS[m2 - 1]}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// Påskdagen (gregoriansk, "anonymous Gregorian algorithm")
export function easterSunday(y: number): string {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${y}-${pad(month)}-${pad(day)}`;
}

// Midsommarafton = fredagen mellan 19 och 25 juni
export function midsommarafton(y: number): string {
  let d = `${y}-06-19`;
  while (weekdayIndex(d) !== 4) d = addDays(d, 1);
  return d;
}

// Alla helgons dag = lördagen mellan 31 oktober och 6 november
function allaHelgonsDag(y: number): string {
  let d = `${y}-10-31`;
  while (weekdayIndex(d) !== 5) d = addDays(d, 1);
  return d;
}

function adventSundays(year: number): string[] {
  const christmas = `${year}-12-25`;
  const fourth = addDays(christmas, -(weekdayIndex(christmas) + 1));
  return [-21, -14, -7, 0].map((n) => addDays(fourth, n));
}

// Lovveckor för Varbergs kommunala grundskolor (måndag–sista lovdag).
// Källa: varberg.se › Läsårstider och lov i grundskolan (läsåren 2026/27–2027/28).
// Raderna märkta "antaget" fanns inte på sidan; de följer samma veckomönster
// och används bara för förra årets program. Lägg till nya läsår här.
const LOV: Record<'sportlov' | 'pasklov' | 'hostlov', Record<number, [string, string]>> = {
  sportlov: {
    2026: ['2026-02-16', '2026-02-20'], // antaget (vecka 8)
    2027: ['2027-02-22', '2027-02-26'],
    2028: ['2028-02-21', '2028-02-25'],
  },
  pasklov: {
    2026: ['2026-04-07', '2026-04-10'], // antaget (veckan efter påsk)
    2027: ['2027-03-30', '2027-04-02'],
    2028: ['2028-04-10', '2028-04-13'],
  },
  hostlov: {
    2025: ['2025-10-27', '2025-10-31'], // antaget (vecka 44)
    2026: ['2026-10-26', '2026-10-30'],
    2027: ['2027-11-01', '2027-11-05'],
  },
};

// Lovfönstret: lördagen före till och med söndagen efter lovet
function lovWindow(kind: keyof typeof LOV, year: number): DateWindow | null {
  const lov = LOV[kind][year];
  if (!lov) return null;
  const [start, end] = lov;
  return { from: addDays(start, -(weekdayIndex(start) + 2)), to: addDays(end, 7 - weekdayIndex(end)) };
}

// ---------- Matchning ----------

const cats = (e: DbEvent) => e.categories ?? [];
const has =
  (...c: string[]) =>
  (e: DbEvent) =>
    cats(e).some((x) => c.includes(x));
// Första kategorin som inte är "Jul" – sprider events jämnare över raderna
const primary =
  (...c: string[]) =>
  (e: DbEvent) => {
    const p = cats(e).find((x) => x !== 'Jul');
    return !!p && c.includes(p);
  };
const named = (re: RegExp) => (e: DbEvent) => re.test(e.name);
const either =
  (...fs: ((e: DbEvent) => boolean)[]) =>
  (e: DbEvent) =>
    fs.some((f) => f(e));
const always = () => true;

// Julord i eventnamnet – fångar t.ex. nyårsfirande som inte har kategorin Jul.
// "jul" får inte följas av "i"/"ia" som eget ord (juli, Julia).
const JUL_NAME =
  /(^|[^a-zåäö])(jul(?!i(?![a-zåäö])|ia)|lucia|advent|nyår|tomte|pepparkak|glögg|skyltsöndag|trettondag|x-?mas|christmas)/i;
const HALLOWEEN_NAME = /halloween|spök|skräck|\brys(lig\w*)?\b|pumpa|zombie|häx|vampyr|läskig/i;

export function assignRail(season: Season, e: DbEvent): string {
  const ordered = season.rails
    .map((r, i) => ({ r, p: r.priority ?? 100 + i }))
    .sort((a, b) => a.p - b.p);
  return (ordered.find(({ r }) => r.match(e)) ?? ordered[ordered.length - 1]).r.key;
}

// ---------- FAQ-hjälpare ----------

function joinSv(parts: string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} och ${parts[parts.length - 1]}`;
}

function describe(e: DbEvent): { text: string; html: string } {
  const day = svDateLabel(e.date_time.slice(0, 10));
  const where = e.venue_name ? `, ${e.venue_name}` : '';
  return {
    text: `${e.name} (${day}${where})`,
    html: `<a href="/event/${escapeHtml(e.event_id)}">${escapeHtml(e.name)}</a> (${escapeHtml(day + where)})`,
  };
}

// "Bland annat A, B och C." – årets lista, annars förra årets med "Förra året …"
function listAnswer(
  ctx: FaqCtx,
  keys: string[],
  max: number,
  now: (list: string) => string,
  before: (list: string) => string,
  none: string
): { a: string; aHtml: string } {
  const pick = (m: Map<string, DbEvent[]>) => keys.flatMap((k) => m.get(k) ?? []).slice(0, max);
  const cur = pick(ctx.rails);
  if (cur.length > 0) {
    const d = cur.map(describe);
    return { a: now(joinSv(d.map((x) => x.text))), aHtml: now(joinSv(d.map((x) => x.html))) };
  }
  const prev = pick(ctx.prevRails);
  if (prev.length > 0) {
    const d = prev.map(describe);
    return { a: `${none} ${before(joinSv(d.map((x) => x.text)))}`, aHtml: `${none} ${before(joinSv(d.map((x) => x.html)))}` };
  }
  return { a: none, aHtml: none };
}

function plain(q: string, text: string): FaqEntry {
  return { q, a: text, aHtml: escapeHtml(text) };
}

const lovFaqDates = (kind: keyof typeof LOV, label: string) => (ctx: FaqCtx) => {
  const lov = LOV[kind][ctx.year];
  return lov
    ? plain(
        `När är ${label} i Varberg ${ctx.year}?`,
        `${capitalize(label)} ${ctx.year} är ${svDateLabel(lov[0])} – ${svDateLabel(lov[1])} (vecka ${isoWeek(lov[0])}) för de kommunala grundskolorna i Varbergs kommun. Friskolor kan ha andra datum.`
      )
    : null;
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------- Rader för lovsidorna ----------

const LOV_RAILS: Rail[] = [
  { key: 'barn', title: 'Lovaktiviteter för barn', tile: 'För barn', match: either(has('Barn & Familj'), named(/lov/i)) },
  { key: 'sport', title: 'Sport och rörelse', tile: 'Sport', match: has('Sport') },
  { key: 'film', title: 'Bio och film', tile: 'Bio', match: has('Film & bio') },
  { key: 'scen', title: 'Scen och musik', tile: 'Scen & musik', match: has('Scen') },
  { key: 'kultur', title: 'Museer, utställningar och visningar', tile: 'Museer', match: has('Utställningar', 'Konst', 'Guidade visningar', 'Föreläsningar') },
  { key: 'natur', title: 'Natur och friluftsliv', match: has('Djur & Natur') },
  { key: 'ovrigt', title: 'Mer som händer under lovet', match: always },
];

// ---------- Säsongerna ----------

const JUL: Season = {
  slug: 'jul-i-varberg',
  name: 'Jul i Varberg',
  label: 'Jul',
  hero: '/hero_jul.webp',
  heroAlt: 'Kallbadhuset i Varberg i vinterskrud',
  window: (y) => ({ from: `${y}-11-01`, to: `${y + 1}-01-07` }),
  include: either(has('Jul'), named(JUL_NAME)),
  rails: [
    { key: 'marknader', title: 'Julmarknader', tile: 'Julmarknader', priority: 2, match: either(named(/marknad|torghandel/i), primary('Marknader')) },
    { key: 'scen', title: 'Konserter och julshower', tile: 'Konserter & shower', match: primary('Scen') },
    { key: 'barn', title: 'För barn och familj', tile: 'För barn', match: primary('Barn & Familj') },
    { key: 'lucia-nyar', title: 'Lucia och nyår', tile: 'Lucia & nyår', priority: 1, match: named(/lucia|nyår/i) },
    { key: 'mat', title: 'Julbord, glögg och julfester', match: primary('Mat & Dryck', 'Nattliv') },
    { key: 'ovrigt', title: 'Mer julstämning', match: always },
  ],
  keyDates: (y) => {
    const [a1, a2, a3, a4] = adventSundays(y);
    return [
      { date: a1, name: 'Första advent' },
      { date: a2, name: 'Andra advent' },
      { date: a3, name: 'Tredje advent' },
      { date: `${y}-12-13`, name: 'Luciadagen' },
      { date: a4, name: 'Fjärde advent' },
      { date: `${y}-12-24`, name: 'Julafton' },
      { date: `${y}-12-31`, name: 'Nyårsafton' },
    ];
  },
  title: (y) => `Jul i Varberg ${y} – julmarknader, julkonserter & Lucia`,
  description: (y, n) =>
    n > 0
      ? `Julmarknader, julkonserter, Lucia och nyår i Varberg ${y}: ${n} julevenemang med datum, tid och plats. Uppdateras dagligen.`
      : `Julmarknader, julkonserter, Lucia och nyår i Varberg ${y}. Julens evenemang samlas här så fort de publiceras.`,
  lead: (_y, n) => (n > 0 ? `${n} julevenemang – julmarknader, konserter, Lucia och nyår.` : 'Julmarknader, julkonserter, Lucia och nyår.'),
  emptyNote: 'Julens evenemang publiceras främst i oktober och november. Sidan fylls på automatiskt när arrangörerna lägger upp dem.',
  newsletterTitle: 'Missa ingen julmarknad',
  promoDays: 42,
  faq: (ctx) => {
    const y = ctx.year;
    const markets = listAnswer(
      ctx,
      ['marknader'],
      8,
      (l) => `Så här ligger julmarknaderna i Varberg ${y}: ${l}.`,
      (l) => `Förra året fanns bland annat ${l}.`,
      'Julmarknaderna publiceras oftast under oktober och november, och vi lägger upp dem här så fort arrangörerna har satt datum.'
    );
    const lucia = listAnswer(
      ctx,
      ['lucia-nyar'],
      4,
      (l) => `Luciadagen ${y} infaller ${svDateLabel(`${y}-12-13`)}. I Varberg kan du se ${l}.`,
      (l) => `Förra året: ${l}.`,
      `Luciadagen ${y} infaller ${svDateLabel(`${y}-12-13`)}.`
    );
    const barn = listAnswer(
      ctx,
      ['barn'],
      5,
      (l) => `Några tips för barnfamiljer: ${l}.`,
      (l) => `Förra året fanns bland annat ${l}.`,
      'Julpyssel, tomtepromenader och barnföreställningar brukar publiceras under november.'
    );
    return [
      { q: `När är julmarknaderna i Varberg ${y}?`, ...markets },
      { q: `När firas Lucia i Varberg ${y}?`, ...lucia },
      { q: 'Vad kan man göra med barn i Varberg i jul?', ...barn },
    ];
  },
};

const SPORTLOV: Season = {
  slug: 'sportlov-i-varberg',
  name: 'Sportlov i Varberg',
  label: 'Sportlov',
  hero: '/hero_vinter.webp',
  heroAlt: 'Kallbadhuset i Varberg i snö',
  window: (y) => lovWindow('sportlov', y),
  rails: LOV_RAILS,
  keyDates: () => [],
  title: (y) => `Sportlov i Varberg ${y} – aktiviteter för barn och familj`,
  description: (y, n) =>
    `Sportlov i Varberg ${y}: ${n > 0 ? `${n} aktiviteter, ` : ''}lovaktiviteter för barn, sport, bio och museer under lovveckan. Uppdateras dagligen.`,
  lead: (y, n) => {
    const lov = LOV.sportlov[y];
    const when = lov ? `Sportlovet ${y} är ${rangeText(lov[0], lov[1])} (vecka ${isoWeek(lov[0])}).` : '';
    return `${when}${n > 0 ? ` ${n} evenemang under lovveckan.` : ''}`.trim();
  },
  emptyNote: 'Lovaktiviteterna publiceras oftast några veckor före lovet. Sidan fylls på automatiskt.',
  newsletterTitle: 'Få lovtipsen i mejlen',
  promoDays: 42,
  faq: (ctx) =>
    [
      lovFaqDates('sportlov', 'sportlovet')(ctx),
      {
        q: 'Vad kan barn göra på sportlovet i Varberg?',
        ...listAnswer(
          ctx,
          ['barn', 'sport'],
          6,
          (l) => `Några tips: ${l}.`,
          (l) => `Förra året fanns bland annat ${l}.`,
          'Lovaktiviteterna läggs upp här så fort de är publicerade.'
        ),
      },
    ].filter((x): x is FaqEntry => !!x),
};

const PASK: Season = {
  slug: 'pask-i-varberg',
  name: 'Påsk i Varberg',
  label: 'Påsk',
  hero: '/hero_spring.webp',
  heroAlt: 'Kallbadhuset i Varberg en vårdag',
  window: (y) => {
    const easter = easterSunday(y);
    const lov = lovWindow('pasklov', y);
    const from = addDays(easter, -3); // skärtorsdag
    const to = addDays(easter, 2); // dagen efter annandag påsk
    return lov ? { from: lov.from < from ? lov.from : from, to: lov.to > to ? lov.to : to } : { from, to };
  },
  rails: [
    { key: 'pask', title: 'Påskmarknader och påskpyssel', tile: 'Påsk', priority: 0, match: named(/påsk/i) },
    ...LOV_RAILS.map((r) => (r.key === 'ovrigt' ? { ...r, title: 'Mer som händer under påsken' } : r)),
  ],
  keyDates: (y) => {
    const e = easterSunday(y);
    return [
      { date: addDays(e, -3), name: 'Skärtorsdag' },
      { date: addDays(e, -2), name: 'Långfredag' },
      { date: addDays(e, -1), name: 'Påskafton' },
      { date: e, name: 'Påskdagen' },
      { date: addDays(e, 1), name: 'Annandag påsk' },
    ];
  },
  title: (y) => `Påsk i Varberg ${y} – påsklov, påskmarknader & aktiviteter`,
  description: (y, n) =>
    `Påsk och påsklov i Varberg ${y}: ${n > 0 ? `${n} evenemang – ` : ''}påskmarknader, påskpyssel och lovaktiviteter för barn. Uppdateras dagligen.`,
  lead: (y, n) => {
    const e = easterSunday(y);
    const lov = LOV.pasklov[y];
    return `Påskdagen ${y} är ${svDateLabel(e)}${lov ? ` och påsklovet ${rangeText(lov[0], lov[1])}` : ''}.${n > 0 ? ` ${n} evenemang under påsken.` : ''}`;
  },
  emptyNote: 'Påskens evenemang publiceras oftast i mars. Sidan fylls på automatiskt.',
  newsletterTitle: 'Få påsktipsen i mejlen',
  promoDays: 42,
  faq: (ctx) => {
    const y = ctx.year;
    return [
      plain(
        `När är påsk ${y}?`,
        `Påskdagen ${y} är ${svDateLabel(easterSunday(y))}. Långfredag är ${svDateLabel(addDays(easterSunday(y), -2))} och annandag påsk ${svDateLabel(addDays(easterSunday(y), 1))}.`
      ),
      lovFaqDates('pasklov', 'påsklovet')(ctx),
      {
        q: `Vad händer i Varberg i påsk ${y}?`,
        ...listAnswer(
          ctx,
          ['pask', 'barn'],
          6,
          (l) => `Bland annat ${l}.`,
          (l) => `Förra året fanns bland annat ${l}.`,
          'Påskens program läggs upp här så fort det är publicerat.'
        ),
      },
    ].filter((x): x is FaqEntry => !!x);
  },
};

const VALBORG: Season = {
  slug: 'valborg-i-varberg',
  name: 'Valborg i Varberg',
  label: 'Valborg',
  hero: '/hero_spring.webp',
  heroAlt: 'Kallbadhuset i Varberg en vårdag',
  window: (y) => ({ from: `${y}-04-29`, to: `${y}-05-02` }),
  rails: [
    { key: 'valborg', title: 'Valborgsfirande', tile: 'Valborg', match: named(/valborg|majbrasa|vårsång|brasa|första maj|1 maj/i) },
    { key: 'ovrigt', title: 'Mer under valborgshelgen', match: always },
  ],
  keyDates: (y) => [
    { date: `${y}-04-30`, name: 'Valborgsmässoafton' },
    { date: `${y}-05-01`, name: 'Första maj' },
  ],
  title: (y) => `Valborg i Varberg ${y} – valborgsfirande och majbrasor`,
  description: (y, n) =>
    `Valborg i Varberg ${y}: valborgsfirande, majbrasor och vårsång${n > 0 ? ` – ${n} evenemang` : ''}. Uppdateras dagligen.`,
  lead: (y, n) => `Valborgsmässoafton är ${svDateLabel(`${y}-04-30`)}.${n > 0 ? ` ${n} evenemang under valborgshelgen.` : ''}`,
  emptyNote: 'Valborgsfirandet publiceras oftast i april. Sidan fylls på automatiskt.',
  newsletterTitle: 'Få helgens tips i mejlen',
  promoDays: 28,
  faq: (ctx) => [
    {
      q: `Var firas valborg i Varberg ${ctx.year}?`,
      ...listAnswer(
        ctx,
        ['valborg'],
        4,
        (l) => `${l}.`,
        (l) => `Förra året: ${l}.`,
        `Valborgsmässoafton ${ctx.year} är ${svDateLabel(`${ctx.year}-04-30`)}. Programmet läggs upp här så fort det är publicerat.`
      ),
    },
  ],
};

const MIDSOMMAR: Season = {
  slug: 'midsommar-i-varberg',
  name: 'Midsommar i Varberg',
  label: 'Midsommar',
  hero: '/hero_midsommar.webp',
  heroAlt: 'Kallbadhuset i Varberg en sommarkväll',
  window: (y) => {
    const afton = midsommarafton(y);
    return { from: addDays(afton, -1), to: addDays(afton, 3) };
  },
  rails: [
    { key: 'midsommar', title: 'Midsommarfirande', tile: 'Midsommar', match: named(/midsommar|stång/i) },
    { key: 'ovrigt', title: 'Mer under midsommarhelgen', match: always },
  ],
  keyDates: (y) => [
    { date: midsommarafton(y), name: 'Midsommarafton' },
    { date: addDays(midsommarafton(y), 1), name: 'Midsommardagen' },
  ],
  title: (y) => `Midsommar i Varberg ${y} – midsommarfirande och dans kring stången`,
  description: (y, n) =>
    `Midsommar i Varberg ${y}: midsommarfirande, dans kring stången och mer under midsommarhelgen${n > 0 ? ` – ${n} evenemang` : ''}.`,
  lead: (y, n) => `Midsommarafton är ${svDateLabel(midsommarafton(y))}.${n > 0 ? ` ${n} evenemang under midsommarhelgen.` : ''}`,
  emptyNote: 'Midsommarfirandet publiceras oftast i maj och juni. Sidan fylls på automatiskt.',
  newsletterTitle: 'Få sommarens tips i mejlen',
  promoDays: 35,
  faq: (ctx) => [
    plain(`När är midsommarafton ${ctx.year}?`, `Midsommarafton ${ctx.year} är ${svDateLabel(midsommarafton(ctx.year))}.`),
    {
      q: 'Var firar man midsommar i Varberg?',
      ...listAnswer(
        ctx,
        ['midsommar'],
        5,
        (l) => `I år: ${l}.`,
        (l) => `Förra året: ${l}.`,
        'Midsommarfirandet läggs upp här så fort det är publicerat.'
      ),
    },
  ],
};

const SOMMAR: Season = {
  slug: 'sommar-i-varberg',
  name: 'Sommar i Varberg',
  label: 'Sommar',
  hero: '/hero_sommar.webp',
  heroAlt: 'Kallbadhuset i Varberg en sommarkväll',
  window: (y) => ({ from: `${y}-06-01`, to: `${y}-09-01` }),
  rails: [
    { key: 'scen', title: 'Konserter och scen', tile: 'Konserter', match: primary('Scen') },
    { key: 'barn', title: 'För barn och familj', tile: 'För barn', match: primary('Barn & Familj') },
    { key: 'marknader', title: 'Marknader och torghandel', tile: 'Marknader', match: primary('Marknader') },
    { key: 'mat', title: 'Mat och dryck', tile: 'Mat & dryck', match: primary('Mat & Dryck') },
    { key: 'sport', title: 'Sport', match: primary('Sport') },
    { key: 'kultur', title: 'Utställningar, konst och visningar', match: primary('Utställningar', 'Konst', 'Guidade visningar', 'Föreläsningar', 'Film & bio') },
    { key: 'natur', title: 'Natur och friluftsliv', match: primary('Djur & Natur') },
    { key: 'nattliv', title: 'Nattliv', match: primary('Nattliv') },
    { key: 'ovrigt', title: 'Mer i sommar', match: always },
  ],
  keyDates: (y) => [
    { date: `${y}-06-06`, name: 'Nationaldagen' },
    { date: midsommarafton(y), name: 'Midsommarafton' },
  ],
  title: (y) => `Sommar i Varberg ${y} – konserter, marknader & sommarlov`,
  description: (y, n) =>
    `Vad händer i Varberg i sommar? ${n > 0 ? `${n} evenemang ${y}: ` : ''}konserter, marknader, barnaktiviteter, mat och sport, juni–augusti. Uppdateras dagligen.`,
  lead: (y, n) => (n > 0 ? `${n} evenemang i Varberg juni–augusti ${y}.` : `Konserter, marknader och sommarlov i Varberg ${y}.`),
  emptyNote: 'Sommarens program publiceras löpande under våren. Sidan fylls på automatiskt.',
  newsletterTitle: 'Få sommarens tips i mejlen',
  promoDays: 45,
  faq: (ctx) => {
    const y = ctx.year;
    return [
      {
        q: `Vilka konserter är det i Varberg sommaren ${y}?`,
        ...listAnswer(
          ctx,
          ['scen'],
          6,
          (l) => `Bland annat ${l}.`,
          (l) => `Förra sommaren fanns bland annat ${l}.`,
          'Sommarens konserter läggs upp här löpande under våren.'
        ),
      },
      {
        q: 'Vad kan man göra med barn i Varberg på sommaren?',
        ...listAnswer(
          ctx,
          ['barn'],
          6,
          (l) => `Några tips: ${l}.`,
          (l) => `Förra sommaren fanns bland annat ${l}.`,
          'Sommarlovsaktiviteterna läggs upp här löpande.'
        ),
      },
      plain(`När är midsommarafton ${y}?`, `Midsommarafton ${y} är ${svDateLabel(midsommarafton(y))}.`),
    ];
  },
};

const HOSTLOV: Season = {
  slug: 'hostlov-i-varberg',
  name: 'Höstlov i Varberg',
  label: 'Höstlov',
  hero: '/hero_host.webp',
  heroAlt: 'Kallbadhuset i Varberg en höstdag',
  window: (y) => lovWindow('hostlov', y),
  rails: [
    { key: 'halloween', title: 'Halloween', tile: 'Halloween', priority: 0, match: named(HALLOWEEN_NAME) },
    ...LOV_RAILS,
  ],
  keyDates: (y) => [
    { date: `${y}-10-31`, name: 'Halloween' },
    { date: allaHelgonsDag(y), name: 'Alla helgons dag' },
  ],
  title: (y) => `Höstlov i Varberg ${y} – Halloween och aktiviteter för barn`,
  description: (y, n) =>
    `Höstlov och Halloween i Varberg ${y}: ${n > 0 ? `${n} evenemang – ` : ''}lovaktiviteter för barn, Halloween, bio och museer. Uppdateras dagligen.`,
  lead: (y, n) => {
    const lov = LOV.hostlov[y];
    const when = lov ? `Höstlovet ${y} är ${rangeText(lov[0], lov[1])} (vecka ${isoWeek(lov[0])}).` : '';
    return `${when}${n > 0 ? ` ${n} evenemang under lovveckan, Halloween inräknat.` : ''}`.trim();
  },
  emptyNote: 'Lovaktiviteterna publiceras oftast några veckor före lovet. Sidan fylls på automatiskt.',
  newsletterTitle: 'Få lovtipsen i mejlen',
  promoDays: 35,
  faq: (ctx) =>
    [
      lovFaqDates('hostlov', 'höstlovet')(ctx),
      {
        q: `Vad händer på Halloween i Varberg ${ctx.year}?`,
        ...listAnswer(
          ctx,
          ['halloween'],
          5,
          (l) => `Bland annat ${l}.`,
          (l) => `Förra året fanns bland annat ${l}.`,
          'Halloweenevenemangen läggs upp här så fort de är publicerade.'
        ),
      },
      {
        q: 'Vad kan barn göra på höstlovet i Varberg?',
        ...listAnswer(
          ctx,
          ['barn'],
          6,
          (l) => `Några tips: ${l}.`,
          (l) => `Förra året fanns bland annat ${l}.`,
          'Lovaktiviteterna läggs upp här så fort de är publicerade.'
        ),
      },
    ].filter((x): x is FaqEntry => !!x),
};

// I kalenderordning – används för länklistor
export const SEASONS: Season[] = [SPORTLOV, PASK, VALBORG, MIDSOMMAR, SOMMAR, HOSTLOV, JUL];

export function findSeason(slug: string): Season | undefined {
  return SEASONS.find((s) => s.slug === slug);
}

// Vilken upplaga sidan visar: den första vars fönster inte har passerat
export function currentEdition(season: Season, today: string): { year: number; window: DateWindow } | null {
  const y = Number(today.slice(0, 4));
  for (const year of [y - 1, y, y + 1, y + 2]) {
    const w = season.window(year);
    if (w && w.to > today) return { year, window: w };
  }
  return null;
}

// Startsidans säsongslänk: den säsong vars fönster tar slut först bland dem
// som är aktiva eller startar inom sina promoDays.
export function seasonPromo(today: string): { slug: string; href: string; label: string } | null {
  const active = SEASONS.map((s) => ({ s, ed: currentEdition(s, today) }))
    .filter((x) => x.ed && addDays(x.ed.window.from, -x.s.promoDays) <= today)
    .sort((a, b) => (a.ed!.window.to < b.ed!.window.to ? -1 : 1));
  const first = active[0];
  return first ? { slug: first.s.slug, href: `/${first.s.slug}`, label: `${first.s.name} ${first.ed!.year}` } : null;
}
