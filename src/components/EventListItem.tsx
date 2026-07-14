import { Calendar, ChevronRight, MapPin } from "lucide-react";
import { EventDisplay, getMainCategory, getAllCategories, EventCategory } from "@/types/event";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useSearchParams } from "react-router-dom";
import { formatLocation } from "@/lib/locationUtils";
import { formatRelativeDate } from "@/lib/dateUtils";
import { usePostHog } from "posthog-js/react";

interface EventListItemProps {
  event: EventDisplay;
  activeFilter?: EventCategory | null; // För smart kategori-visning
}

// Kategori-badgen på bilden är avstängd för att låta bilden ta plats.
// Sätt till true för att visa den igen.
const SHOW_CATEGORY_BADGE = false;

export function EventListItem({ event, activeFilter }: EventListItemProps) {
  const posthog = usePostHog();
  const [searchParams] = useSearchParams();
  const locationInfo = formatLocation(event.venue_name, event.location);
  
  // Multi-category logic with smart display
  const allCategories = getAllCategories(event);
  let displayCategory: EventCategory;
  let additionalCount: number;
  
  // Om vi filtrerar på en specifik kategori och eventet har den kategorin
  if (activeFilter && allCategories.includes(activeFilter)) {
    displayCategory = activeFilter;
    additionalCount = allCategories.length - 1;
  } else {
    // Normal visning (huvudkategori + antal fler)
    displayCategory = getMainCategory(event);
    additionalCount = allCategories.length - 1;
  }
  
  // SEO-friendly alt text
  const imageAlt = `${event.title} - ${displayCategory} evenemang i Varberg ${event.date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })}`;
  
  // Build URL with preserved search params
  const eventUrl = `/event/${event.id}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  
  const handleClick = () => {
    posthog?.capture('event_card_clicked', {
      event_id: event.id,
      event_title: event.title,
      category: displayCategory,
      is_featured: event.isFeatured,
    });
  };

  return (
    <Link to={eventUrl} className="block" onClick={handleClick}>
      <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-[#4A90E2]/50 active:scale-[0.99] transition-all duration-200 cursor-pointer">
        <div className="flex h-28 sm:h-32">
          {/* Image - Fixed width on left */}
          <div className="w-28 sm:w-36 flex-shrink-0 relative">
            <img
              src={event.image}
              alt={imageAlt}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            {SHOW_CATEGORY_BADGE && (
              <div className="absolute top-0 left-0 rounded-br-lg text-xs px-2 py-1 font-medium bg-white/90 backdrop-blur text-blue-900">
                {displayCategory}
                {additionalCount > 0 && (
                  <span className="ml-1 text-xs opacity-75">+{additionalCount}</span>
                )}
              </div>
            )}
          </div>

          {/* Content - Flexible width on right */}
          <div className="flex-1 p-3 sm:p-5 flex flex-col min-w-0">
            {/* Header with title */}
            <div>
              <h3 className="text-sm sm:text-base font-semibold leading-snug line-clamp-2">{event.title}</h3>
              {event.isFeatured && (
                <p className="text-xs italic mt-1" style={{ color: '#4A90E2' }}>
                  Marknadsfört event
                </p>
              )}
            </div>

            {/* Event details - aligned to bottom */}
            <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-auto pt-2 min-w-0">
              <div className="flex items-center gap-1 min-w-0">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {formatRelativeDate(event.date)}
                  {event.time === 'Hela dagen' ? ', hela dagen' : `, kl ${event.time}`}
                </span>
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                {locationInfo.hasVenueName ? (
                  <span className="truncate">{locationInfo.venueName}</span>
                ) : (
                  <span className="truncate">{locationInfo.address}</span>
                )}
              </div>
            </div>
          </div>

          {/* Chevron - signalerar att kortet är klickbart */}
          <div className="flex items-center pr-2.5 sm:pr-4 flex-shrink-0 text-muted-foreground">
            <ChevronRight className="h-5 w-5" style={{ opacity: 0.5 }} />
          </div>
        </div>
      </div>
    </Link>
  );
}