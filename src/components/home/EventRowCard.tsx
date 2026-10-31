"use client";

import { usePostHog } from "posthog-js/react";
import { Link } from "@/lib/router";
import { optimizedImage } from "@/lib/images";
import { formatLocation } from "@/lib/locationUtils";
import { EventDisplay, getCategoryChipColor, getMainCategory } from "@/types/event";
import { ClockIcon, PinIcon } from "./icons";

interface EventRowCardProps {
  event: EventDisplay;
  whenText: string;
  rowKey: string;
}

// Kortet i startsidans rader: bild, kategori, titel (alltid två rader), tid, plats
export function EventRowCard({ event, whenText, rowKey }: EventRowCardProps) {
  const posthog = usePostHog();
  const category = getMainCategory(event);
  const location = formatLocation(event.venue_name, event.location);
  const place = location.hasVenueName ? location.venueName : location.address;

  return (
    <Link
      to={`/event/${event.id}`}
      onClick={() =>
        posthog?.capture("event_card_clicked", {
          event_id: event.id,
          event_title: event.title,
          category,
          is_featured: event.isFeatured,
          source: "home_row",
          row: rowKey,
        })
      }
      className="flex w-[244px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-[#F4F5F7] transition-colors hover:bg-[#ECEEF2] lg:w-[268px]"
    >
      <div className="h-36 bg-[#E9ECF0] lg:h-[168px]">
        <img
          src={optimizedImage(event.image, 640)}
          alt={`${event.title} – ${category} i Varberg`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-col px-3.5 pb-3.5 pt-3 lg:px-4 lg:pb-4 lg:pt-3.5">
        <span className="text-[13px] font-semibold leading-4" style={{ color: getCategoryChipColor(category).text }}>
          {category}
        </span>
        <h3 className="mt-1 line-clamp-2 h-[42px] text-base font-bold leading-[21px] text-ink lg:h-[44px] lg:text-[17px] lg:leading-[22px]">
          {event.title}
        </h3>
        <div className="mt-2.5 flex flex-col gap-1 text-[13px] leading-[18px] text-ink-soft lg:text-[13.5px] lg:leading-[19px]">
          <span className="flex items-center gap-1.5">
            <ClockIcon />
            <span className="font-semibold text-ink">{whenText}</span>
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <PinIcon />
            <span className="truncate">{place}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
