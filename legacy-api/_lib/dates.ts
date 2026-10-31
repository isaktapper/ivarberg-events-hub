import { TZ } from './constants';

// Datumhjälpare för de serverrenderade sidorna. Flyttade oförändrade från api/landing.ts.

export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().split('T')[0];
}

// 0 = måndag ... 6 = söndag
export function weekdayIndex(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export function rangeLabel(from: string, to: string): string {
  return `${svDateLabel(from)} – ${svDateLabel(addDays(to, -1))}`;
}

// Helgen = fredag–söndag, samma logik som startsidans "I helgen"-filter (Hero.tsx),
// men aldrig bakåt i tiden: står vi mitt i helgen börjar intervallet idag.
export function weekendRange(today: string): { from: string; to: string } {
  const wd = weekdayIndex(today); // 0 = mån
  const friday = addDays(today, 4 - wd); // denna veckas fredag (bakåt om lör/sön, framåt annars)
  const from = friday < today ? today : friday;
  const sunday = addDays(friday, 2);
  return { from, to: addDays(sunday, 1) };
}

// Dagens datum i svensk tid (serverlösa funktioner kör i UTC)
export function stockholmToday(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(new Date());
}

export function svDateLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  const weekday = new Intl.DateTimeFormat('sv-SE', { weekday: 'long', timeZone: 'UTC' }).format(dt);
  const dayMonth = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(dt);
  return `${weekday} ${dayMonth}`;
}
