"use client";

import { EventDisplay } from "@/types/event";
import { useMemo } from "react";
import { usePostHog } from "posthog-js/react";
import { HALLOWEEN_THEME, isHalloweenEvent, isHalloweenSeason } from "@/lib/seasonal";

interface HeroProps {
  onThemeSelect: (theme: string) => void;
  events: EventDisplay[];
}

// Kompakt bildbanner överst på startsidan. Snabbfiltren är ersatta av raderna under.
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
    <section className="mx-auto w-full max-w-[1280px] px-4 pt-3 lg:px-10 lg:pt-6">
      <div
        className="relative flex min-h-[240px] flex-col justify-end overflow-hidden rounded-3xl bg-ink bg-cover bg-center p-5 sm:min-h-[300px] lg:min-h-[340px] lg:p-10"
        style={{
          backgroundImage: halloween ? "url('/hero_halloween.webp')" : "url('/hero_host.webp')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/5" />

        <div className="relative flex flex-col items-start gap-2 lg:gap-3">
          <h1 className="text-[32px] font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Vad händer i Varberg?
          </h1>
          <p className="max-w-xl text-base font-medium leading-snug text-white/90 lg:text-lg">
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
