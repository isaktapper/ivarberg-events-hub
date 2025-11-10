import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar, MapPin } from "lucide-react";
import { EventDisplay } from "@/types/event";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatLocation } from "@/lib/locationUtils";

interface SimilarEventsCarouselProps {
  events: EventDisplay[];
}

export function SimilarEventsCarousel({ events }: SimilarEventsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  if (!events || events.length === 0) {
    return null;
  }

  const itemsPerView = {
    mobile: 1,
    tablet: 2,
    desktop: 3
  };

  // Beräkna max index baserat på skärmstorlek
  const getMaxIndex = useCallback(() => {
    if (typeof window === 'undefined') return events.length - 1;
    
    const width = window.innerWidth;
    if (width < 640) return events.length - itemsPerView.mobile; // mobile
    if (width < 1024) return events.length - itemsPerView.tablet; // tablet
    return events.length - itemsPerView.desktop; // desktop
  }, [events.length]);

  const [maxIndex, setMaxIndex] = useState(getMaxIndex());

  // Uppdatera maxIndex när fönstret ändrar storlek
  useEffect(() => {
    const handleResize = () => {
      setMaxIndex(getMaxIndex());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getMaxIndex]);

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

  // Lägg till scroll listener
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    carousel.addEventListener('scroll', handleScroll);
    return () => carousel.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

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

  const nextSlide = () => {
    const newIndex = Math.min(currentIndex + 1, Math.max(0, events.length - 1));
    scrollToIndex(newIndex);
  };

  const prevSlide = () => {
    const newIndex = Math.max(currentIndex - 1, 0);
    scrollToIndex(newIndex);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold" style={{ color: '#08075C' }}>
          Liknande evenemang
        </h3>
        
        {events.length > 1 && (
          <div className="hidden sm:flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextSlide}
              disabled={currentIndex >= events.length - 1}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden">
        <div
          ref={carouselRef}
          className="flex gap-4 transition-transform duration-300 ease-out overflow-x-auto scrollbar-hide"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {events.map((event) => {
            const locationInfo = formatLocation(event.venue_name, event.location);
            const imageAlt = `${event.title} - ${event.category} evenemang i Varberg ${event.date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })}`;
            
            return (
              <Link
                key={event.id}
                to={`/event/${event.id}`}
                className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 group"
                style={{ scrollSnapAlign: 'start' }}
              >
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 h-full">
                  {/* Image */}
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={event.image}
                      alt={imageAlt}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Category badge */}
                    <div className="absolute top-3 left-3 px-2 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: '#F5F3F0', color: '#08075C' }}>
                      {event.category}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <h4 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors" style={{ color: '#08075C' }}>
                      {event.title}
                    </h4>
                    
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          {event.date.toLocaleDateString('sv-SE', { 
                            month: 'short', 
                            day: 'numeric' 
                          })} - {event.time}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
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

      {/* Dots indicator for mobile */}
      {events.length > 1 && (
        <div className="flex justify-center gap-1 mt-4 sm:hidden">
          {events.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              aria-label={`Gå till evenemang ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Mobile navigation arrows */}
      {events.length > 1 && (
        <div className="flex justify-between items-center mt-4 sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm text-gray-500">
            {currentIndex + 1} av {events.length}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={nextSlide}
            disabled={currentIndex >= events.length - 1}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
