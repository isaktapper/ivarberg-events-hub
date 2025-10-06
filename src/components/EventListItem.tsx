import { Calendar, MapPin } from "lucide-react";
import { EventDisplay } from "@/types/event";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { formatLocation } from "@/lib/locationUtils";

interface EventListItemProps {
  event: EventDisplay;
}

export function EventListItem({ event }: EventListItemProps) {
  const locationInfo = formatLocation(event.venue_name, event.location);
  
  return (
    <Link to={`/event/${event.id}`} className="block">
      <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer">
        <div className="flex h-28 sm:h-32">
          {/* Image - Fixed width on left */}
          <div className="w-28 sm:w-36 flex-shrink-0 relative">
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            {/* Category badge overlayed on image - covers the entire corner */}
            <div className="absolute top-0 left-0 rounded-br-lg text-xs px-2 py-1 font-medium" style={{ backgroundColor: '#F5F3F0', color: '#08075C' }}>
              {event.category}
            </div>
          </div>
          
          {/* Content - Flexible width on right */}
          <div className="flex-1 p-4 sm:p-5 flex flex-col min-w-0">
            {/* Header with title */}
            <div className="mb-auto">
              <h3 className="text-sm sm:text-base font-semibold leading-tight truncate">{event.title}</h3>
              {event.isFeatured && (
                <p className="text-xs italic mt-1" style={{ color: '#4A90E2' }}>
                  Marknadsfört event
                </p>
              )}
            </div>
            
            {/* Bottom section with event details - aligned to bottom */}
            <div className="flex items-end justify-between gap-2 mt-2">
              {/* Event details */}
              <div className="flex flex-col gap-1 text-xs text-muted-foreground flex-1 min-w-0">
                <div className="flex items-center gap-1 min-w-0">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{event.date.toLocaleDateString('sv-SE')} - {event.time}</span>
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
              
              {/* Visual indicator that card is clickable */}
              <div className="text-xs text-muted-foreground flex-shrink-0">
                →
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}