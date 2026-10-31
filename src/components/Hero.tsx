"use client";

import { EventDisplay } from "@/types/event";
import { useMemo } from "react";
import { usePostHog } from "posthog-js/react";
import { HALLOWEEN_THEME, isHalloweenEvent, isHalloweenSeason } from "@/lib/seasonal";

interface HeroProps {
  onThemeSelect: (theme: string) => void;
  events: EventDisplay[];
}

// Bild kant till kant överst på startsidan som tonar ut i vitt. Snabbfiltren är ersatta av raderna under.
export function Hero({ onThemeSelect, events }: HeroProps) {
  const posthog = usePostHog();
  const halloween = isHalloweenSeason();

  // Samma matchning som halloweenfiltret på startsidan, så att siffran stämmer med träffarna
  const halloweenCount = useMemo(
    () => (halloween ? events.filter((e) => isHalloweenEvent(e)).length : 0),
    [events, halloween]
  );

  const handleHalloweenClick = () => {
    posthog?.capture('quick_filter_clicked', {
      filter_id: 'halloween',
      filter_label: 'Halloween',
      filter_type: 'theme',
    });
    onThemeSelect(HALLOWEEN_THEME);
  };

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
          <p className="max-w-xl text-base font-medium leading-snug text-white/90 drop-shadow-md lg:text-xl">
            {halloween
              ? 'Det spökar i Varberg. Hitta något läskigt – eller mysigt – att göra.'
              : 'Hitta evenemang som får hjärtat att slå lite snabbare.'}
          </p>

          {halloween && halloweenCount > 0 && (
            <button
              type="button"
              onClick={handleHalloweenClick}
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-white/90"
            >
              <span aria-hidden="true">🎃</span>
              Halloween i Varberg
              <span className="text-ink-soft">{halloweenCount}</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
