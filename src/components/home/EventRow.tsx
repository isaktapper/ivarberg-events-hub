"use client";

import { useRef } from "react";
import type { HomeRow } from "@/lib/homeRows";
import { EventRowCard } from "./EventRowCard";
import { ArrowRightIcon, ChevronIcon } from "./icons";

interface EventRowProps {
  row: HomeRow;
  /** Visar listan nedanför filtrerad på radens datum */
  onSeeAll: (row: HomeRow) => void;
}

// En rad på startsidan: rubrik med datum, kort i sidled och "Se alla"
export function EventRow({ row, onSeeAll }: EventRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const seeAllHref = `/?dateStart=${row.start}&dateEnd=${row.end}#alla-evenemang`;

  const scrollBy = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const seeAll = (e: React.MouseEvent) => {
    e.preventDefault();
    onSeeAll(row);
  };

  return (
    <section className="mx-auto flex w-full max-w-[1280px] flex-col gap-3 lg:gap-4">
      <div className="flex items-center justify-between gap-6 px-4 lg:px-10">
        <h2 className="text-2xl font-bold leading-tight text-ink lg:text-[28px]">
          {row.label} <span className="font-medium text-ink-soft">{row.dateShort}</span>
        </h2>
        <div className="hidden items-center gap-4 lg:flex">
          <a href={seeAllHref} onClick={seeAll} className="flex items-center gap-1.5 text-[15px] font-semibold text-sea hover:text-sea-dark">
            {row.seeAll} ({row.count})
            <ArrowRightIcon />
          </a>
          <div className="flex gap-2">
            <button type="button" aria-label="Föregående" onClick={() => scrollBy(-1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F4F5F7] text-ink hover:bg-[#E9ECF0]">
              <ChevronIcon direction="left" />
            </button>
            <button type="button" aria-label="Nästa" onClick={() => scrollBy(1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F4F5F7] text-ink hover:bg-[#E9ECF0]">
              <ChevronIcon direction="right" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="scrollbar-hide flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 lg:scroll-px-10 lg:gap-5 lg:px-10"
      >
        {row.items.map((item) => (
          <EventRowCard key={item.event.id} event={item.event} whenText={item.whenText} rowKey={row.key} />
        ))}
        <a
          href={seeAllHref}
          onClick={seeAll}
          className="flex w-[150px] shrink-0 snap-start flex-col justify-between rounded-2xl bg-sea px-4 py-[18px] text-white transition-colors hover:bg-sea-dark lg:w-[200px] lg:px-5 lg:py-[22px]"
        >
          <span className="text-[15px] font-semibold leading-snug lg:text-[17px]">{row.seeAll}</span>
          <span className="flex items-center justify-between">
            <span className="text-[28px] font-bold leading-none lg:text-[32px]">{row.count}</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sea lg:h-11 lg:w-11">
              <ArrowRightIcon className="h-[18px] w-[18px]" />
            </span>
          </span>
        </a>
      </div>

      <a
        href={seeAllHref}
        onClick={seeAll}
        className="mx-4 flex min-h-12 items-center justify-between rounded-xl bg-[#F4F5F7] px-4 lg:hidden"
      >
        <span className="text-[15px] font-semibold text-ink">{row.seeAll}</span>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-sea">
          {row.count}
          <ArrowRightIcon />
        </span>
      </a>
    </section>
  );
}
