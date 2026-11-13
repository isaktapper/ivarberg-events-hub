"use client";

import { Calendar } from "lucide-react";
import { addDays, ymd } from "@/lib/homeRows";

const WEEKDAYS_SHORT = ["sön", "mån", "tis", "ons", "tor", "fre", "lör"];
const WEEKDAYS_LONG = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];
const MONTHS_SHORT = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const MONTHS_LONG = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];

/** Antal dagar i raden, från idag */
export const STRIP_DAYS = 14;

const TILE =
  "flex h-[66px] min-w-[58px] shrink-0 flex-col items-center justify-center rounded-xl px-1.5 transition-colors";
const tileClass = (active: boolean) =>
  `${TILE} ${active ? "bg-ink text-white" : "bg-[#F4F5F7] text-ink hover:bg-[#ECEEF2]"}`;
const softClass = (active: boolean) => (active ? "text-white/80" : "text-ink-soft");

interface DayStripProps {
  /** Dagens datum, kl 00:00 */
  today: Date;
  /** Antal evenemang per dag (YYYY-MM-DD), med kategori och område applicerade men inte datum */
  counts: Record<string, number>;
  total: number;
  /** Valt intervall som YYYY-MM-DD, eller undefined när alla dagar visas */
  selected?: { start: string; end: string };
  onSelectDay: (day: Date) => void;
  onSelectAll: () => void;
  /** Rutan sist i raden: öppnar kalendern (DateFilter med egen trigger) */
  renderDatePicker: (trigger: React.ReactElement) => React.ReactNode;
}

// Dagväljaren överst i "Alla evenemang": en ruta per dag med antal evenemang.
export function DayStrip({ today, counts, total, selected, onSelectDay, onSelectAll, renderDatePicker }: DayStripProps) {
  const days = Array.from({ length: STRIP_DAYS }, (_, i) => addDays(today, i));
  const lastKey = ymd(days[days.length - 1]);
  // Ett valt datum som ligger utanför raden visas på Datum-rutan
  const outside = !!selected && (selected.start > lastKey || selected.end > lastKey);
  const outsideLabel = selected
    ? (() => {
        const [, m, d] = selected.start.split("-").map(Number);
        return `${d} ${MONTHS_SHORT[m - 1]}${selected.start === selected.end ? "" : "–"}`;
      })()
    : "";

  return (
    <div
      role="group"
      aria-label="Välj dag"
      className="scrollbar-hide flex gap-2 overflow-x-auto px-4 lg:px-0"
      suppressHydrationWarning
    >
      <button
        type="button"
        aria-pressed={!selected}
        aria-label={`Alla dagar, ${total} evenemang`}
        onClick={onSelectAll}
        className={tileClass(!selected)}
      >
        <span className="text-[15px] font-bold leading-[23px]">Alla</span>
        <span className={`text-[11.5px] font-medium leading-[14px] ${softClass(!selected)}`}>{total} st</span>
      </button>

      {days.map((day, i) => {
        const key = ymd(day);
        const n = counts[key] ?? 0;
        const active = !!selected && key >= selected.start && key <= selected.end;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            aria-label={`${i === 0 ? "Idag, " : ""}${WEEKDAYS_LONG[day.getDay()]} ${day.getDate()} ${MONTHS_LONG[day.getMonth()]}, ${n} evenemang`}
            onClick={() => onSelectDay(day)}
            className={tileClass(active)}
            suppressHydrationWarning
          >
            <span suppressHydrationWarning className={`text-xs font-semibold leading-[15px] ${softClass(active)} ${n === 0 && !active ? "opacity-60" : ""}`}>
              {i === 0 ? "idag" : WEEKDAYS_SHORT[day.getDay()]}
            </span>
            <span suppressHydrationWarning className={`text-lg font-bold leading-[23px] ${n === 0 && !active ? "opacity-50" : ""}`}>
              {day.getDate()}
            </span>
            <span suppressHydrationWarning className={`text-[11.5px] font-medium leading-[14px] ${softClass(active)}`}>
              {n} st
            </span>
          </button>
        );
      })}

      {renderDatePicker(
        <button type="button" aria-label="Välj ett annat datum" aria-pressed={outside} className={`${tileClass(outside)} gap-[3px]`}>
          <Calendar className="h-[19px] w-[19px]" aria-hidden="true" />
          <span className="text-xs font-semibold leading-[15px]">{outside ? outsideLabel : "Datum"}</span>
        </button>
      )}
    </div>
  );
}
