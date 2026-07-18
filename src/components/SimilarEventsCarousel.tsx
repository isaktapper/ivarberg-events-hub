import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar, MapPin, ArrowRight } from "lucide-react";
import { EventDisplay, getMainCategory, getCategoryChipColor } from "@/types/event";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import { formatLocation } from "@/lib/locationUtils";

interface SimilarEventsCarouselProps {
  events: EventDisplay[];
  title?: string;
  onEventClick?: (event: EventDisplay) => void;
}

export function SimilarEventsCarousel({ events, title = 'Liknande evenemang', onEventClick }: SimilarEventsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();

  // Hantera scroll-events för att uppdatera currentIndex
  const handleScroll = useCallback(() => {
    if (!carouselRef.current) return;

    const scrollLeft = carouselRef.current.scrollLeft;
    const itemWidth = carouselRef.current.scrollWidth / events.length;
    const newIndex = Math.round(scrollLeft / itemWidth);

    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, events.length]);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    carousel.addEventListener('scroll', handleScroll);
    return () => carousel.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (!events || events.length === 0) {
    return null;
  }

  const scrollToIndex = (index: number) => {
    const newIndex = Math.max(0, Math.min(index, Math.max(0, events.length - 1)));
    setCurrentIndex(newIndex);

    if (carouselRef.current) {
      const itemWidth = carouselRef.current.scrollWidth / events.length;
      carouselRef.current.scrollTo({
        left: itemWidth * newIndex,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-card rounded-xl p-5 border border-border">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-[19px] font-bold text-ink">
          {title}
        </h2>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm font-semibold text-sea hover:text-sea-dark transition-colors whitespace-nowrap"
          >
            Fler
            <ArrowRight className="h-4 w-4" />
          </Link>
          {events.length > 1 && (
            <div className="hidden sm:flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => scrollToIndex(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="h-8 w-8 p-0"
                aria-label="Föregående evenemang"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => scrollToIndex(currentIndex + 1)}
                disabled={currentIndex >= events.length - 1}
                className="h-8 w-8 p-0"
                aria-label="Nästa evenemang"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="relative overflow-hidden">
        {/* Peek: nästa kort skymtar så att det syns att listan fortsätter */}
        <div
          ref={carouselRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {events.map((event) => {
            const locationInfo = formatLocation(event.venue_name, event.location);
            const mainCategory = getMainCategory(event);
            const chip = getCategoryChipColor(mainCategory);
            const imageAlt = `${event.title} - ${mainCategory} evenemang i Varberg ${event.date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })}`;

            const eventUrl = `/event/${event.id}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

            return (
              <Link
                key={event.id}
                to={eventUrl}
                onClick={() => onEventClick?.(event)}
                className="flex-shrink-0 w-[85%] sm:w-[46%] lg:w-[31%] group"
                style={{ scrollSnapAlign: 'start' }}
              >
                <div className="bg-white border border-border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 h-full">
                  {/* Image */}
                  <div className="relative h-36 overflow-hidden">
                    <img
                      src={event.image}
                      alt={imageAlt}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span
                      className="absolute top-2.5 left-2.5 px-2.5 py-1 text-xs font-semibold rounded-full"
                      style={{ backgroundColor: chip.bg, color: chip.text }}
                    >
                      {mainCategory}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-3.5">
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2 text-ink group-hover:text-sea transition-colors">
                      {event.title}
                    </h3>

                    <div className="space-y-1 text-xs text-ink-soft">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          {event.date.toLocaleDateString('sv-SE', {
                            month: 'short',
                            day: 'numeric'
                          })}{event.time ? ` kl ${event.time}` : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          {locationInfo.hasVenueName ? locationInfo.venueName : locationInfo.address}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
