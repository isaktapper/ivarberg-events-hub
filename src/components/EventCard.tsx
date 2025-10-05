import { Calendar, MapPin, Clock } from "lucide-react";
import { EventDisplay, categoryColors } from "@/types/event";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatLocation } from "@/lib/locationUtils";

interface EventCardProps {
  event: EventDisplay;
}

export function EventCard({ event }: EventCardProps) {
  const categoryColor = categoryColors[event.category];
  const locationInfo = formatLocation(event.venue_name, event.location);
  
  return (
    <div className="rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 card-hover group" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className={`absolute top-4 left-4 px-3 py-1 ${categoryColor} text-white text-xs font-semibold rounded-full`}>
          {event.category}
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-2 line-clamp-2" style={{ color: '#08075C' }}>{event.title}</h3>
          {event.isFeatured && (
            <p className="text-sm italic" style={{ color: '#4A90E2' }}>
              Marknadsfört event
            </p>
          )}
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm" style={{ color: '#08075C', opacity: 0.7 }}>
            <Calendar className="h-4 w-4" style={{ color: '#4A90E2' }} />
            <span>{event.date.toLocaleDateString('sv-SE', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm" style={{ color: '#08075C', opacity: 0.7 }}>
            <Clock className="h-4 w-4" style={{ color: '#4A90E2' }} />
            <span>{event.time}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm" style={{ color: '#08075C', opacity: 0.7 }}>
            <MapPin className="h-4 w-4" style={{ color: '#4A90E2' }} />
            {locationInfo.hasVenueName ? (
              <span className="truncate">{locationInfo.venueName}</span>
            ) : (
              <span className="truncate">{locationInfo.address}</span>
            )}
          </div>
        </div>
        
        <div className="flex justify-end pt-4" style={{ borderTop: '1px solid #08075C', borderOpacity: 0.1 }}>
          <Button 
            variant="default" 
            size="sm"
            style={{
              backgroundColor: '#4A90E2',
              color: '#FFFFFF',
              border: 'none'
            }}
          >
            Läs mer
          </Button>
        </div>
      </div>
    </div>
  );
}