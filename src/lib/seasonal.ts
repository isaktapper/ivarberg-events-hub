/**
 * Säsongsteman för den publika sidan. Allt styrs av datum så att temat
 * slår på och av av sig självt varje år – ingen deploy behövs.
 */

import type { EventDisplay } from "@/types/event";

/** Värdet på `tema`-parametern i URL:en när halloweenfiltret är aktivt. */
export const HALLOWEEN_THEME = "halloween";

/**
 * Alla helgons dag i Sverige: lördagen mellan 31 oktober och 6 november.
 */
function allSaintsDay(year: number): Date {
  const d = new Date(year, 9, 31);
  while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
  return d;
}

/** Sista dagen i halloweensäsongen: söndagen efter Alla helgons dag, 23:59. */
function halloweenSeasonEnd(year: number): Date {
  const end = allSaintsDay(year);
  end.setDate(end.getDate() + 1);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Halloweensäsong: från 24 oktober till och med söndagen efter Alla helgons dag.
 * `?halloween=1` i URL:en tvingar på temat för förhandsgranskning.
 */
export function isHalloweenSeason(now: Date = new Date()): boolean {
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("halloween") === "1") {
    return true;
  }

  const year = now.getFullYear();
  return now >= new Date(year, 9, 24) && now <= halloweenSeasonEnd(year);
}

// Titeln väger tyngst – där räcker även "rys"/"ryslig" (Rys & Krogmys, Ryslig hamnvandring).
// I beskrivningen krävs tydligare ord, annars fastnar t.ex. vanliga höstlovsevent.
const HALLOWEEN_TITLE = /halloween|spök|skräck|\brys(lig\w*)?\b|pumpa|zombie|häx|vampyr/i;
const HALLOWEEN_DESCRIPTION = /halloween|spök|läskig|zombie|pumpa|häx|vampyr/i;

/**
 * Halloweenevent = infaller senast sista dagen i säsongen och har halloweenord i
 * titel eller beskrivning. Datumgränsen gör att t.ex. "kuslig" mörkervandring i
 * december eller en dokumentär om häxor i november inte räknas.
 */
export function isHalloweenEvent(event: EventDisplay, now: Date = new Date()): boolean {
  if (new Date(event.date) > halloweenSeasonEnd(now.getFullYear())) return false;
  return HALLOWEEN_TITLE.test(event.title) || HALLOWEEN_DESCRIPTION.test(event.description || "");
}
