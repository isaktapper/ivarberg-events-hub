import type { DbEvent } from './supabase';
import { svDateLabel } from './dates';

// Event-/texthjälpare för de serverrenderade sidorna. Flyttade oförändrade från api/landing.ts.

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Grov markdown -> ren text för korta beskrivningar
export function plainText(md: string | null, maxLen = 180): string {
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

export function eventTime(e: DbEvent): string | null {
  const t = e.date_time.slice(11, 16);
  return t === '00:00' ? null : t.replace(':', '.');
}

export function eventDayLabel(e: DbEvent): string {
  return svDateLabel(e.date_time.slice(0, 10));
}

export function mainCategory(e: DbEvent): string {
  return e.categories?.[0] || 'Evenemang';
}

export interface PriceInfo { free: boolean; amount: number | null; label: string | null }
export function parsePrice(p: string | null): PriceInfo {
  if (!p || !p.trim()) return { free: false, amount: null, label: null };
  const s = p.trim();
  if (/^(gratis|fri entré|fritt inträde|0)$/i.test(s)) return { free: true, amount: 0, label: 'Gratis' };
  const m = s.match(/(\d+(?:[.,]\d+)?)/);
  const amount = m ? parseFloat(m[1].replace(',', '.')) : null;
  return { free: false, amount, label: s };
}

// Serie-event (t.ex. utställningar) ligger som en rad per dag i databasen.
// För översiktslistor visar vi nästa förekomst per namn – kalendern (dag för
// dag) ska däremot INTE dedupliceras.
export function dedupeByName(events: DbEvent[]): DbEvent[] {
  const seen = new Set<string>();
  return events.filter((e) => (seen.has(e.name) ? false : (seen.add(e.name), true)));
}

// Välj periodens "hetaste" event: featured först, därefter events med tid,
// plats och beskrivning – med spridning över kategorier.
export function pickHighlights(events: DbEvent[], count = 3): DbEvent[] {
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
