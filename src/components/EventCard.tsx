import { Calendar, MapPin, Clock } from "lucide-react";
import { EventDisplay, categoryColors } from "@/types/event";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatLocation } from "@/lib/locationUtils";

interface EventCardProps {
  event: EventDisplay;
}

// Ta bort Markdown-syntax och skapa preview
const createPreview = (markdown: string, maxLength: number = 150): string => {
  return markdown
    .replace(/[#*_\[\]`]/g, '') // Ta bort Markdown-tecken
    .replace(/\n+/g, ' ')        // Ersätt newlines med space
    .substring(0, maxLength)
    .trim() + '...';
};

export function EventCard({ event }: EventCardProps) {
  const categoryColor = categoryColors[event.category];
  const locationInfo = formatLocation(event.venue_name, event.location);
  
  // SEO-friendly alt text with event details
  const imageAlt = `${event.title} - ${event.category} evenemang i Varberg ${event.date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  return (
    <div className="event-card group cursor-pointer">
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.image}
          alt={imageAlt}
          loading="lazy"
          className="event-card-image group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute top-4 left-4 px-3 py-1.5 text-xs font-semibold rounded-full shadow-lg" style={{ backgroundColor: '#F5F3F0', color: '#08075C' }}>
          {event.category}
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200" style={{ color: '#08075C' }}>{event.title}</h3>
          {event.isFeatured && (
            <div className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
              ✨ Marknadsfört event
            </div>
          )}
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-full">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <span className="font-medium">{event.date.toLocaleDateString('sv-SE', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}</span>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-full">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <span className="font-medium">{event.time}</span>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-full">
              <MapPin className="h-4 w-4 text-blue-600" />
            </div>
            {locationInfo.hasVenueName ? (
              <span className="truncate font-medium">{locationInfo.venueName}</span>
            ) : (
              <span className="truncate font-medium">{locationInfo.address}</span>
            )}
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-100">
          <Button 
            variant="default" 
            size="sm"
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group-hover:scale-[1.02]"
          >
            Läs mer
          </Button>
        </div>
      </div>
    </div>
  );
}