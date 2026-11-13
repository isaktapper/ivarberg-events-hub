"use client";

import { usePostHog } from "posthog-js/react";
import { Link } from "@/lib/router";
import { optimizedImage } from "@/lib/images";
import { formatLocation } from "@/lib/locationUtils";
import { timeText } from "@/lib/homeRows";
import { EventDisplay, getCategoryChipColor, getMainCategory } from "@/types/event";
import { ClockIcon, PinIcon } from "./icons";

// En rad i "Alla evenemang": bild, kategori, titel, tid och plats
export function EventListRow({ event }: { event: EventDisplay }) {
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
          source: "home_list",
        })
      }
      className="flex gap-3 rounded-[14px] bg-[#F4F5F7] p-2.5 transition-colors hover:bg-[#ECEEF2] lg:gap-3.5 lg:p-3"
    >
      <img
        src={optimizedImage(event.image, 320)}
        alt={`${event.title} – ${category} i Varberg`}
        loading="lazy"
        decoding="async"
        className="h-[76px] w-[76px] shrink-0 rounded-[10px] bg-[#E9ECF0] object-cover lg:h-24 lg:w-24"
      />
      <div className="flex min-w-0 flex-col justify-center">
        <span className="text-[12.5px] font-semibold leading-4 lg:text-[13px]" style={{ color: getCategoryChipColor(category).text }}>
          {category}
        </span>
        <h4 className="mt-0.5 line-clamp-2 text-[15px] font-bold leading-5 text-ink lg:text-base lg:leading-[21px]">{event.title}</h4>
        <span className="mt-1 flex min-w-0 items-center gap-3 text-[12.5px] leading-[17px] text-ink-soft lg:text-[13px] lg:leading-[18px]">
          <span className="flex shrink-0 items-center gap-1">
            <ClockIcon className="h-[13px] w-[13px]" />
            <span className="font-semibold text-ink">{timeText(event)}</span>
          </span>
          <span className="flex min-w-0 items-center gap-1">
            <PinIcon className="h-[13px] w-[13px]" />
            <span className="truncate">{place}</span>
          </span>
        </span>
      </div>
    </Link>
  );
}
