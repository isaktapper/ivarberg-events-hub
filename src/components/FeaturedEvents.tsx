import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Calendar, 
  Music, 
  PartyPopper, 
  Dumbbell, 
  Palette, 
  Users, 
  Utensils,
  Film,
  Flower2,
  Eye,
  ShoppingBag,
  TreePine
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EventCategory } from "@/types/event";

interface FeaturedEvent {
  id: string;
  title: string;
  location: string;
  venue_name: string;
  date: string;
  category: EventCategory;
  image: string;
}

// Mock data för featured events
const mockFeaturedEvents: FeaturedEvent[] = [
  {
    id: "1",
    title: "Julmarknad på Varbergs Fästning",
    location: "Varbergs Fästning",
    venue_name: "Varbergs Fästning",
    date: "2025-12-07",
    category: "Marknader",
    image: "/varberg_hero.jpg"
  },
  {
    id: "2",
    title: "Adventskonsert med Varbergs Kammarkör",
    location: "Varbergs Kyrka, Kyrkogatan 10",
    venue_name: "Varbergs Kyrka",
    date: "2025-12-01",
    category: "Scen",
    image: "/src/assets/konsert.jpg"
  },
  {
    id: "3",
    title: "Stand-up Comedy: Helgkväll med humor",
    location: "Societetshuset, Engelbrektsgatan 17",
    venue_name: "Societetshuset",
    date: "2025-11-30",
    category: "Nattliv",
    image: "/src/assets/nattklubb.jpg"
  },
  {
    id: "4",
    title: "Familjeföreställning: Pettson och Findus",
    location: "Varbergs Teater, Kungsgatan 24",
    venue_name: "Varbergs Teater",
    date: "2025-12-08",
    category: "Barn & Familj",
    image: "/src/assets/barnteater.jpg"
  },
  {
    id: "5",
    title: "Vinprovning med lokala ostar",
    location: "Restaurang Havsbris, Strandpromenaden 5",
    venue_name: "Restaurang Havsbris",
    date: "2025-12-03",
    category: "Mat & Dryck",
    image: "/src/assets/restaurang.jpg"
  },
  {
    id: "6",
    title: "Fotoutställning: Varbergs Four Seasons",
    location: "Varbergs Konsthall, Danska vägen 10",
    venue_name: "Varbergs Konsthall",
    date: "2025-11-28",
    category: "Utställningar",
    image: "/src/assets/konst.jpg"
  }
];

// Category icons
const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Scen":
      return Music;
    case "Nattliv":
      return PartyPopper;
    case "Sport":
      return Dumbbell;
    case "Utställningar":
      return Palette;
    case "Barn & Familj":
      return Users;
    case "Mat & Dryck":
      return Utensils;
    case "Film & bio":
      return Film;
    case "Djur & Natur":
      return Flower2;
    case "Guidade visningar":
      return Eye;
    case "Marknader":
      return ShoppingBag;
    case "Jul":
      return TreePine;
    case "Föreläsningar":
      return Users;
    default:
      return Sparkles;
  }
};

// Format date to Swedish
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

export function FeaturedEvents() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const mainFeatured = mockFeaturedEvents[0];
  const carouselEvents = mockFeaturedEvents.slice(1);

  // Auto-advance carousel every 5 seconds (pause on hover)
  useEffect(() => {
    if (!isHovered) {
      const interval = setInterval(() => {
        handleNext();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isHovered]);

  // Handle infinite loop: jump back to start without transition
  useEffect(() => {
    // For mobile: jump after last real item
    // For desktop: jump after we can't show 3 more items
    if (currentIndex === carouselEvents.length) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(0);
        setTimeout(() => setIsTransitioning(true), 50);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, carouselEvents.length]);

  const handlePrevious = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => {
      if (prev === 0) {
        return carouselEvents.length - 1;
      }
      return prev - 1;
    });
  };

  const handleNext = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swiped left
      handleNext();
    }
    if (touchStart - touchEnd < -75) {
      // Swiped right
      handlePrevious();
    }
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  return (
    <div className="space-y-6">
      {/* Main Featured Event - Glassmorphic Card */}
      <div 
        onClick={() => handleEventClick(mainFeatured.id)}
        className="relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)'
        }}
      >
        {/* iVarberg tipsar badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}
        >
          <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
          <span className="text-xs font-semibold text-gray-900">iVarberg tipsar</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-4 p-6">
          {/* Event Image */}
          <div className="w-full md:w-48 h-32 md:h-28 rounded-lg overflow-hidden flex-shrink-0">
            <img 
              src={mainFeatured.image} 
              alt={mainFeatured.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Event Details */}
          <div className="flex-1 text-left space-y-2">
            <h3 className="text-lg md:text-xl font-bold text-white line-clamp-2">
              {mainFeatured.title}
            </h3>
            
            <div className="flex flex-col gap-1.5 text-white/90 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{mainFeatured.venue_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span>{formatDate(mainFeatured.date)}</span>
              </div>
            </div>

            {/* Category Badge */}
            <div className="flex items-center gap-2 pt-1">
              {(() => {
                const Icon = getCategoryIcon(mainFeatured.category);
                return <Icon className="h-4 w-4 text-white" />;
              })()}
              <span className="text-sm font-medium text-white">
                {mainFeatured.category}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Featured Carousel */}
      <div className="space-y-4">
        {/* Carousel Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-bold text-white">iVarberg tipsar</h2>
          </div>
        </div>

        {/* Carousel Container */}
        <div 
          ref={containerRef}
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Carousel Track */}
          <div className="overflow-hidden">
            {/* Mobile: Sliding carousel */}
            <div className="md:hidden overflow-hidden">
              <div 
                className="flex gap-4"
                style={{
                  transform: `translateX(calc(-${currentIndex} * (100% + 1rem)))`,
                  transition: isTransitioning ? 'transform 500ms ease-in-out' : 'none'
                }}
              >
                {/* Duplicate first item at the end for seamless loop */}
                {[...carouselEvents, carouselEvents[0]].map((event, idx) => {
                  const Icon = getCategoryIcon(event.category);
                  
                  return (
                    <div
                      key={`mobile-${event.id}-${idx}`}
                      className="flex-shrink-0 w-full"
                    >
                      <div
                        onClick={() => handleEventClick(event.id)}
                        className="rounded-xl overflow-hidden backdrop-blur-md h-full cursor-pointer hover:opacity-90"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.15)'
                        }}
                      >
                        {/* Event Image */}
                        <div className="w-full h-32 overflow-hidden">
                          <img 
                            src={event.image} 
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Event Details */}
                        <div className="p-4 space-y-2">
                          <h3 className="text-sm font-bold text-white line-clamp-2 text-left">
                            {event.title}
                          </h3>
                          
                          <div className="flex flex-col gap-1 text-white/80 text-xs">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate text-left">{event.venue_name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span className="text-left">{formatDate(event.date)}</span>
                            </div>
                          </div>

                          {/* Category Badge */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <Icon className="h-3.5 w-3.5 text-white" />
                            <span className="text-xs font-medium text-white">
                              {event.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop: Sliding carousel with 3 visible cards */}
            <div className="hidden md:block overflow-hidden">
              <div 
                className="flex gap-4"
                style={{
                  transform: `translateX(calc(-${currentIndex} * (33.333% + 0.333rem)))`,
                  transition: isTransitioning ? 'transform 500ms ease-in-out' : 'none'
                }}
              >
                {/* Duplicate first 3 items at the end for seamless loop */}
                {[...carouselEvents, ...carouselEvents.slice(0, 3)].map((event, idx) => {
                  const Icon = getCategoryIcon(event.category);
                  
                  return (
                    <div
                      key={`desktop-${event.id}-${idx}`}
                      className="flex-shrink-0"
                      style={{ 
                        minWidth: 'calc((100% - 2rem) / 3)',
                        maxWidth: 'calc((100% - 2rem) / 3)',
                        width: 'calc((100% - 2rem) / 3)'
                      }}
                    >
                      <div 
                        onClick={() => handleEventClick(event.id)}
                        className="rounded-xl overflow-hidden backdrop-blur-md h-full cursor-pointer hover:opacity-90"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.15)'
                        }}
                      >
                        {/* Event Image */}
                        <div className="w-full h-32 overflow-hidden">
                          <img 
                            src={event.image} 
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Event Details */}
                        <div className="p-4 space-y-2">
                          <h3 className="text-sm font-bold text-white line-clamp-2 text-left">
                            {event.title}
                          </h3>
                          
                          <div className="flex flex-col gap-1 text-white/80 text-xs">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate text-left">{event.venue_name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span className="text-left">{formatDate(event.date)}</span>
                            </div>
                          </div>

                          {/* Category Badge */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <Icon className="h-3.5 w-3.5 text-white" />
                            <span className="text-xs font-medium text-white">
                              {event.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={handlePrevious}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 items-center justify-center w-10 h-10 rounded-full backdrop-blur-md transition-all duration-200 hover:scale-110 z-10"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <button
            onClick={handleNext}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 items-center justify-center w-10 h-10 rounded-full backdrop-blur-md transition-all duration-200 hover:scale-110 z-10"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Navigation Dots */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {carouselEvents.map((_, idx) => {
            const isActive = (currentIndex % carouselEvents.length) === idx;
            return (
              <button
                key={idx}
                onClick={() => {
                  setIsTransitioning(true);
                  setCurrentIndex(idx);
                }}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: isActive
                    ? 'rgba(255, 255, 255, 0.9)' 
                    : 'rgba(255, 255, 255, 0.3)',
                  transform: isActive ? 'scale(1.2)' : 'scale(1)'
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

