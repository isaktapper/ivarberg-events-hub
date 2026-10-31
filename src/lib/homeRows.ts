/**
 * Startsidans rader ("Idag", "Imorgon", "I helgen" …). Räknas fram på servern
 * (src/app/page.tsx) så att HTML:en och klienten visar samma sak.
 *
 * Vilka rader som visas beror på veckodag: helgen prioriteras, vardagar med få
 * evenemang slås ihop till en rad, och det blir aldrig fler än fyra rader.
 */

import type { EventDisplay } from "@/types/event";
import { getSortableDate, normalizeSeriesTitle } from "@/services/eventService";

export const MAX_CARDS_PER_ROW = 8;

const WEEKDAYS_SHORT = ["sön", "mån", "tis", "ons", "tor", "fre", "lör"];
const WEEKDAYS_LONG = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"];
const MONTHS_SHORT = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

export interface HomeRowItem {
  event: EventDisplay;
  whenText: string;
}

export interface HomeRow {
  key: string;
  label: string;
  dateShort: string;
  count: number;
  seeAll: string;
  /** YYYY-MM-DD, används för "Se alla" (datumfilter i listan) */
  start: string;
  end: string;
  items: HomeRowItem[];
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "lör 31 okt" */
export function shortDate(d: Date): string {
  return `${WEEKDAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** "2–6 nov" eller "30 okt–1 nov" */
function rangeDate(a: Date, b: Date): string {
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${MONTHS_SHORT[a.getMonth()]}`;
  return `${a.getDate()} ${MONTHS_SHORT[a.getMonth()]}–${b.getDate()} ${MONTHS_SHORT[b.getMonth()]}`;
}

/** Rubrik för en dag i listan: "Idag" / "Imorgon" / "Måndag", plus "2 nov" */
export function dayHeading(day: Date, now: Date): { label: string; dateShort: string } {
  const diff = Math.round((startOfDay(day).getTime() - startOfDay(now).getTime()) / 86400000);
  if (diff === 0) return { label: "Idag", dateShort: shortDate(day) };
  if (diff === 1) return { label: "Imorgon", dateShort: shortDate(day) };
  return { label: WEEKDAYS_LONG[day.getDay()], dateShort: `${day.getDate()} ${MONTHS_SHORT[day.getMonth()]}` };
}

export function timeText(event: EventDisplay): string {
  return event.time || "Tid ej angiven";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function seriesKey(e: EventDisplay): string {
  return `${normalizeSeriesTitle(e.title)}|${e.organizer?.name || e.venue_name || e.location}`;
}

function hasRealImage(e: EventDisplay): boolean {
  return !!e.image && e.image !== "/placeholder.svg";
}

interface Period {
  key: string;
  label: string;
  seeAll: string;
  from: number; // dagar från idag, inklusive
  to: number;
}

// Rader per veckodag (0 = söndag). Se docs/skalning och designen på ritytan.
function periodsFor(weekday: number): Period[] {
  const idag: Period = { key: "idag", label: "Idag", seeAll: "Se alla evenemang idag", from: 0, to: 0 };
  const imorgon: Period = { key: "imorgon", label: "Imorgon", seeAll: "Se alla evenemang imorgon", from: 1, to: 1 };
  const p = (key: string, label: string, seeAll: string, from: number, to: number): Period => ({ key, label, seeAll, from, to });
  switch (weekday) {
    case 1: return [idag, imorgon, p("helgen", "I helgen", "Se alla evenemang i helgen", 4, 6), p("veckan", "Senare i veckan", "Se alla evenemang senare i veckan", 2, 3)];
    case 2: return [idag, imorgon, p("helgen", "I helgen", "Se alla evenemang i helgen", 3, 5), p("veckan", "Senare i veckan", "Se alla evenemang senare i veckan", 2, 2)];
    case 3: return [idag, imorgon, p("helgen", "I helgen", "Se alla evenemang i helgen", 2, 4), p("nasta-vecka", "Nästa vecka", "Se alla evenemang nästa vecka", 5, 9)];
    case 4: return [idag, imorgon, p("helgen", "I helgen", "Se alla evenemang i helgen", 2, 3), p("nasta-vecka", "Nästa vecka", "Se alla evenemang nästa vecka", 4, 8)];
    case 5: return [idag, imorgon, p("sondag", "Söndag", "Se alla evenemang på söndag", 2, 2), p("nasta-vecka", "Nästa vecka", "Se alla evenemang nästa vecka", 3, 7)];
    case 6: return [idag, imorgon, p("nasta-vecka", "Nästa vecka", "Se alla evenemang nästa vecka", 2, 6), p("nasta-helg", "Nästa helg", "Se alla evenemang nästa helg", 7, 8)];
    default: return [idag, p("veckan", "Den här veckan", "Se alla evenemang den här veckan", 1, 5), p("nasta-helg", "Nästa helg", "Se alla evenemang nästa helg", 6, 7)];
  }
}

export function buildHomeRows(events: EventDisplay[], now: Date = new Date()): HomeRow[] {
  const today = startOfDay(now);

  // Serier: samma titel och arrangör på minst 3 olika dagar (Konstklubbens
  // utställning, Friskis-pass, "Höstlovsvecka" …) sorteras sist
  const seriesDays = new Map<string, Set<string>>();
  for (const e of events) {
    const k = seriesKey(e);
    if (!seriesDays.has(k)) seriesDays.set(k, new Set());
    seriesDays.get(k)!.add(ymd(e.date));
  }
  const isRecurring = (e: EventDisplay) => (seriesDays.get(seriesKey(e))?.size ?? 0) >= 3;

  const score = (e: EventDisplay) =>
    (e.isFeatured ? 100 : 0) + (hasRealImage(e) ? 2 : 0) + (e.time ? 1 : 0) - (isRecurring(e) ? 50 : 0);

  const rows: HomeRow[] = [];
  for (const period of periodsFor(now.getDay())) {
    const start = addDays(today, period.from);
    const end = addDays(today, period.to);
    const startMs = start.getTime();
    const endMs = addDays(end, 1).getTime();
    const inPeriod = events.filter((e) => {
      const t = startOfDay(e.date).getTime();
      return t >= startMs && t < endMs;
    });
    if (inPeriod.length === 0) continue;

    const multiDay = period.from !== period.to;
    let candidates: HomeRowItem[];

    if (multiDay) {
      // Samma serie flera gånger i perioden → ett kort med "Flera datum"
      const bySeries = new Map<string, EventDisplay[]>();
      for (const e of inPeriod) {
        const k = seriesKey(e);
        if (!bySeries.has(k)) bySeries.set(k, []);
        bySeries.get(k)!.push(e);
      }
      candidates = [...bySeries.values()].map((group) => {
        const sorted = [...group].sort((a, b) => a.date.getTime() - b.date.getTime());
        const first = sorted[0];
        if (sorted.length > 1) {
          const last = sorted[sorted.length - 1];
          return { event: first, whenText: `Flera datum ${WEEKDAYS_SHORT[first.date.getDay()]}–${WEEKDAYS_SHORT[last.date.getDay()]}` };
        }
        const day = `${capitalize(WEEKDAYS_SHORT[first.date.getDay()])} ${first.date.getDate()} ${MONTHS_SHORT[first.date.getMonth()]}`;
        return { event: first, whenText: first.time ? `${day} kl ${first.time}` : day };
      });
    } else {
      candidates = inPeriod.map((e) => ({ event: e, whenText: timeText(e) }));
    }

    candidates.sort((a, b) => {
      const multiA = a.whenText.startsWith("Flera datum") ? 1 : 0;
      const multiB = b.whenText.startsWith("Flera datum") ? 1 : 0;
      if (multiA !== multiB) return multiA - multiB;
      const diff = score(b.event) - score(a.event);
      if (diff !== 0) return diff;
      return getSortableDate(a.event.date) - getSortableDate(b.event.date);
    });

    rows.push({
      key: period.key,
      label: period.label,
      dateShort: multiDay ? rangeDate(start, end) : shortDate(start),
      count: inPeriod.length,
      seeAll: period.seeAll,
      start: ymd(start),
      end: ymd(end),
      items: candidates.slice(0, MAX_CARDS_PER_ROW),
    });
  }
  return rows;
}
