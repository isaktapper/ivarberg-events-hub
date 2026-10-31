"use client";

import { useEffect, useRef } from "react";
import { Instagram } from "lucide-react";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/constants";

interface InstagramPromoCardProps {
  onShown: () => void;
  onClick: () => void;
}

// Inline-variant av Instagram-promon – renderas som ett kort mitt i eventflödet.
export function InstagramPromoCard({ onShown, onClick }: InstagramPromoCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hasShownRef = useRef(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || hasShownRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !hasShownRef.current) {
          hasShownRef.current = true;
          onShown();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onShown]);

  return (
    <div ref={rootRef} className="bg-navy rounded-lg p-4 sm:p-5">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-full bg-sand/10 text-seaglass">
          <Instagram className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm sm:text-base font-semibold text-sand leading-snug">
            Missa inget i Varberg
          </p>
          <p className="text-xs sm:text-sm text-sand/70 mt-0.5">
            Följ {INSTAGRAM_HANDLE} på Instagram för dagliga eventtips
          </p>
        </div>

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClick}
          className="flex-shrink-0 rounded-full bg-seaglass px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-seaglass/85"
        >
          Följ oss
        </a>
      </div>
    </div>
  );
}
