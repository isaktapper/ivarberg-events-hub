"use client";

import { useMemo } from "react";
import { CalendarDays, Clock, Snowflake, Users } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { EventDisplay, hasCategory } from "@/types/event";
import { HALLOWEEN_THEME, isHalloweenEvent, isHalloweenSeason } from "@/lib/seasonal";
import { addDays, startOfDay, ymd } from "@/lib/homeRows";
import { seasonPromo } from "../../legacy-api/_lib/seasons";
import { stockholmToday } from "../../legacy-api/_lib/dates";

const WEEKDAYS = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"];
const MONTHS = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];

interface HeroProps {
  events: EventDisplay[];
  onThemeSelect: (theme: string) => void;
  /** Snabbknapparna Idag och I helgen: visar listan för de dagarna */
  onDateRange: (start: Date, end: Date) => void;
  /** Snabbknappen För familjen: visar listan filtrerad på Barn & Familj */
  onFamily: () => void;
}

const QUICK =
  "flex min-h-[50px] min-w-0 items-center justify-center gap-1.5 rounded-full border px-2 text-sm font-semibold tracking-[-0.01em] backdrop-blur-lg transition-colors min-[480px]:gap-2 min-[480px]:px-3.5 min-[480px]:text-[15px] lg:min-h-[54px]";
// Blåtonat glas som på den tidigare startsidan
const QUICK_GLASS = `${QUICK} border-white/70 bg-[rgba(215,235,255,0.6)] text-ink hover:border-white/90 hover:bg-sea hover:text-white`;
const QUICK_POPPY = `${QUICK} border-white/40 bg-[hsl(var(--poppy))] text-white hover:bg-[hsl(20_80%_33%)]`;
// Julen får en djupröd knapp med snöflinga
const QUICK_JUL = `${QUICK} border-white/40 bg-[#B3261E] text-white hover:bg-[#8F1D17]`;
const QUICK_COUNT =
  "min-w-[22px] rounded-full bg-white px-[5px] text-center text-xs font-semibold leading-5 text-ink";
const QUICK_ICON = "h-4 w-4 shrink-0 min-[480px]:h-[18px] min-[480px]:w-[18px]";

// Bild kant till kant som tonar ut i vitt, med dagens siffror och fyra snabbknappar.
export function Hero({ events, onThemeSelect, onDateRange, onFamily }: HeroProps) {
  const posthog = usePostHog();
  const halloween = isHalloweenSeason();
  // Länk till aktuell säsongssida (jul, sportlov, sommar …) – under halloween har temat redan en egen knapp
  const promo = halloween ? null : seasonPromo(stockholmToday());

  const today = startOfDay(new Date());
  const weekday = today.getDay();
  const weekendStart = weekday === 6 || weekday === 0 ? today : addDays(today, 5 - weekday);
  const weekendEnd = weekday === 0 ? today : addDays(weekendStart, weekday === 6 ? 1 : 2);
  const todayKey = ymd(today);
  const weekendFrom = ymd(weekendStart);
  const weekendTo = ymd(weekendEnd);

  // Samma matchning som filtren i listan, så att siffrorna stämmer med träffarna
  const counts = useMemo(() => {
    let todayCount = 0;
    let weekendCount = 0;
    let familyCount = 0;
    let halloweenCount = 0;
    for (const e of events) {
      const day = ymd(e.date);
      if (day === todayKey) todayCount++;
      if (day >= weekendFrom && day <= weekendTo) weekendCount++;
      if (hasCategory(e, "Barn & Familj")) familyCount++;
      if (halloween && isHalloweenEvent(e)) halloweenCount++;
    }
    return { todayCount, weekendCount, familyCount, halloweenCount };
  }, [events, todayKey, weekendFrom, weekendTo, halloween]);

  const track = (id: string, label: string, type: string) =>
    posthog?.capture("quick_filter_clicked", { filter_id: id, filter_label: label, filter_type: type });

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Bilden slutar en bit ovanför kanten så att övergången alltid landar i rent vitt */}
      <div
        className="absolute inset-x-0 top-0 bottom-6 bg-cover bg-center"
        style={{
          backgroundImage: halloween ? "url('/hero_halloween.webp')" : "url('/hero_host.webp')",
        }}
      >
        {/* Mörkt upptill för läsbarhet, tonar sedan ut i sidans vita bakgrund */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/0" />
        <div
          className="absolute inset-x-0 -bottom-px h-1/2"
          style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.75) 55%, #fff 90%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-[1280px] px-4 pb-24 pt-12 text-center sm:pb-32 sm:pt-16 lg:pb-40 lg:pt-20">
        <div className="flex flex-col items-center gap-3 lg:gap-4">
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] sm:text-5xl lg:text-7xl">
            Vad händer i Varberg?
          </h1>
          {/* Datum och antal räknas i besökarens tidszon, därav suppressHydrationWarning */}
          <p className="max-w-xl text-base font-medium leading-snug text-white/90 drop-shadow-md lg:text-xl">
            <span suppressHydrationWarning>
              {WEEKDAYS[weekday]} {today.getDate()} {MONTHS[today.getMonth()]}.
            </span>{" "}
            <span suppressHydrationWarning className="inline-block">
              {counts.todayCount} evenemang idag och {counts.weekendCount} i helgen.
            </span>
          </p>

          <div className="mt-3 grid w-full max-w-[24rem] grid-cols-2 gap-2.5 min-[480px]:max-w-[30rem] min-[900px]:max-w-[54rem] min-[900px]:grid-cols-4 min-[900px]:gap-3">
            <button
              type="button"
              className={QUICK_GLASS}
              onClick={() => {
                track("today", "Idag", "date");
                onDateRange(today, today);
              }}
            >
              <Clock className={QUICK_ICON} aria-hidden="true" />
              <span className="truncate">Idag</span>
              <span suppressHydrationWarning className={QUICK_COUNT}>{counts.todayCount}</span>
            </button>
            <button
              type="button"
              className={QUICK_GLASS}
              onClick={() => {
                track("weekend", "I helgen", "date");
                onDateRange(weekendStart, weekendEnd);
              }}
            >
              <CalendarDays className={QUICK_ICON} aria-hidden="true" />
              <span className="truncate">I helgen</span>
              <span suppressHydrationWarning className={QUICK_COUNT}>{counts.weekendCount}</span>
            </button>
            <button
              type="button"
              className={QUICK_GLASS}
              onClick={() => {
                track("family", "För familjen", "category");
                onFamily();
              }}
            >
              <Users className={QUICK_ICON} aria-hidden="true" />
              <span className="truncate">För familjen</span>
              <span className={QUICK_COUNT}>{counts.familyCount}</span>
            </button>

            {halloween && counts.halloweenCount > 0 ? (
              <button
                type="button"
                className={QUICK_POPPY}
                onClick={() => {
                  track("halloween", "Halloween", "theme");
                  onThemeSelect(HALLOWEEN_THEME);
                }}
              >
                <span aria-hidden="true">🎃</span>
                <span className="truncate">Halloween</span>
                <span className={`${QUICK_COUNT} text-[hsl(var(--poppy))]`}>{counts.halloweenCount}</span>
              </button>
            ) : promo ? (
              // Länkar till säsongssidan, t.ex. /jul-i-varberg
              <a
                href={promo.href}
                className={promo.slug === "jul-i-varberg" ? QUICK_JUL : QUICK_POPPY}
                onClick={() =>
                  posthog?.capture("season_page_clicked", { href: promo.href, label: promo.label, source: "hero" })
                }
              >
                {promo.slug === "jul-i-varberg" && <Snowflake className={QUICK_ICON} aria-hidden="true" />}
                <span className="truncate">{promo.label.replace(/ \d{4}$/, "")}</span>
                <span aria-hidden="true">→</span>
              </a>
            ) : (
              <button
                type="button"
                className={QUICK_GLASS}
                onClick={() => {
                  track("tomorrow", "Imorgon", "date");
                  onDateRange(addDays(today, 1), addDays(today, 1));
                }}
              >
                <CalendarDays className={QUICK_ICON} aria-hidden="true" />
                <span className="truncate">Imorgon</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
