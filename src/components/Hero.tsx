import { Calendar, Clock, Snowflake, MessageCircle, Search, Tag, MapPin, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCategory, EventDisplay } from "@/types/event";
import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePostHog } from "posthog-js/react";

interface QuickFilter {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type: 'date' | 'category';
  value?: EventCategory;
  dateRange?: { start: Date; end: Date };
}

// Alla kategorier
const ALL_CATEGORIES: EventCategory[] = [
  "Scen", "Nattliv", "Sport", "Utställningar", "Föreläsningar",
  "Barn & Familj", "Mat & Dryck", "Jul", "Film & bio",
  "Djur & Natur", "Guidade visningar", "Marknader", "Okategoriserad"
];

interface SearchSuggestion {
  type: 'category' | 'venue' | 'event';
  label: string;
  subLabel?: string;
  count?: number;
  eventId?: string;
  category?: EventCategory;
}

interface HeroProps {
  onFilterApply: (filter: QuickFilter) => void;
  onScrollToResults: () => void;
  onScrollToCategories: () => void;
  onSearchChange: (searchTerm: string) => void;
  onCategorySelect: (category: EventCategory) => void;
  events: EventDisplay[];
  initialSearchTerm?: string;
}

export function Hero({ onFilterApply, onScrollToResults, onScrollToCategories, onSearchChange, onCategorySelect, events, initialSearchTerm = "" }: HeroProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const posthog = usePostHog();

  // Sync with external searchTerm (from URL)
  useEffect(() => {
    setSearchTerm(initialSearchTerm);
  }, [initialSearchTerm]);

  // Hitta förslag baserat på söktermen
  const suggestions = useMemo((): SearchSuggestion[] => {
    if (!searchTerm.trim() || searchTerm.length < 2) return [];
    
    const searchLower = searchTerm.toLowerCase().trim();
    const results: SearchSuggestion[] = [];
    
    // 1. Sök matchande kategorier
    const matchingCategories = ALL_CATEGORIES.filter(cat => 
      cat.toLowerCase().includes(searchLower)
    );
    
    matchingCategories.forEach(category => {
      const count = events.filter(event => 
        event.categories?.includes(category) || event.category === category
      ).length;
      
      if (count > 0) {
        results.push({
          type: 'category',
          label: category,
          count,
          category
        });
      }
    });
    
    // 2. Sök matchande platser/venues (unika, med fuzzy matching för liknande namn)
    // Normalisera namn för att gruppera liknande (t.ex. "Societén" och "Societen")
    const normalizeVenueName = (name: string): string => {
      return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Ta bort accenter
        .replace(/[^a-z0-9\s]/g, '') // Ta bort specialtecken
        .trim();
    };
    
    // Mappa normaliserat namn → { originalNames: Map<string, count>, totalCount }
    const normalizedVenueMap = new Map<string, { originalNames: Map<string, number>, totalCount: number }>();
    
    events.forEach(event => {
      if (event.venue_name && event.venue_name.toLowerCase().includes(searchLower)) {
        const normalized = normalizeVenueName(event.venue_name);
        
        if (!normalizedVenueMap.has(normalized)) {
          normalizedVenueMap.set(normalized, { originalNames: new Map(), totalCount: 0 });
        }
        
        const entry = normalizedVenueMap.get(normalized)!;
        const currentCount = entry.originalNames.get(event.venue_name) || 0;
        entry.originalNames.set(event.venue_name, currentCount + 1);
        entry.totalCount++;
      }
    });
    
    // Välj det mest använda originalnamnet för varje grupp
    Array.from(normalizedVenueMap.entries())
      .sort((a, b) => b[1].totalCount - a[1].totalCount) // Sortera på totalCount
      .slice(0, 3) // Max 3 platser
      .forEach(([_, { originalNames, totalCount }]) => {
        // Hitta det vanligaste originalnamnet
        let bestName = '';
        let bestCount = 0;
        originalNames.forEach((count, name) => {
          if (count > bestCount) {
            bestCount = count;
            bestName = name;
          }
        });
        
        results.push({
          type: 'venue',
          label: bestName,
          count: totalCount
        });
      });
    
    // 3. Sök matchande evenemang
    const matchingEvents = events.filter(event => {
      const titleMatch = event.title.toLowerCase().includes(searchLower);
      const organizerMatch = event.organizer?.name.toLowerCase().includes(searchLower) || false;
      return titleMatch || organizerMatch;
    }).slice(0, 5); // Max 5 evenemang
    
    matchingEvents.forEach(event => {
      results.push({
        type: 'event',
        label: event.title,
        subLabel: event.venue_name || event.location,
        eventId: event.id
      });
    });
    
    return results;
  }, [searchTerm, events]);

  // Totalt antal träffar för "Visa alla"
  const totalResults = useMemo(() => {
    if (!searchTerm.trim()) return 0;
    const searchLower = searchTerm.toLowerCase().trim();
    return events.filter(event => {
      const titleMatch = event.title.toLowerCase().includes(searchLower);
      const venueMatch = event.venue_name?.toLowerCase().includes(searchLower) || false;
      const locationMatch = event.location.toLowerCase().includes(searchLower);
      const organizerMatch = event.organizer?.name.toLowerCase().includes(searchLower) || false;
      return titleMatch || venueMatch || locationMatch || organizerMatch;
    }).length;
  }, [searchTerm, events]);

  // Stäng dropdown när man klickar utanför
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // Hjälpfunktion för att stänga mobiltangentbord
  const dismissKeyboard = () => {
    if (inputRef.current) {
      inputRef.current.setAttribute('readonly', 'readonly');
      inputRef.current.blur();
      setTimeout(() => {
        inputRef.current?.removeAttribute('readonly');
      }, 100);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    posthog?.capture('search_suggestion_clicked', {
      search_term: searchTerm,
      suggestion_type: suggestion.type,
      suggestion_label: suggestion.label,
      suggestion_count: suggestion.count,
    });
    
    dismissKeyboard();
    
    if (suggestion.type === 'category' && suggestion.category) {
      // Välj kategori
      onCategorySelect(suggestion.category);
      setSearchTerm("");
      onSearchChange("");
      setIsDropdownOpen(false);
      setTimeout(() => onScrollToResults(), 100);
    } else if (suggestion.type === 'venue') {
      // Sök på platsnamnet
      setSearchTerm(suggestion.label);
      onSearchChange(suggestion.label);
      setIsDropdownOpen(false);
      setTimeout(() => onScrollToResults(), 100);
    } else if (suggestion.type === 'event' && suggestion.eventId) {
      // Gå till eventsidan med behållna URL-parametrar
      setIsDropdownOpen(false);
      const eventUrl = `/event/${suggestion.eventId}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      navigate(eventUrl);
    }
  };

  const handleShowAllResults = () => {
    posthog?.capture('search_performed', {
      search_term: searchTerm,
      results_count: totalResults,
      search_method: 'show_all_button',
    });
    
    dismissKeyboard();
    setIsDropdownOpen(false);
    setTimeout(() => onScrollToResults(), 150);
  };
  // Beräkna helgens datum (fredag, lördag, söndag)
  const getWeekendDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = söndag, 1 = måndag, ..., 6 = lördag
    
    let friday, sunday;
    
    if (currentDay >= 5 || currentDay === 0) {
      // Om det är fredag (5), lördag (6) eller söndag (0) - välj DENNA helg
      if (currentDay === 0) {
        // Om det är söndag, gå tillbaka till fredagen
        friday = new Date(today);
        friday.setDate(today.getDate() - 2); // Fredag var 2 dagar sedan
      } else if (currentDay === 6) {
        // Om det är lördag, gå tillbaka till fredagen
        friday = new Date(today);
        friday.setDate(today.getDate() - 1); // Fredag var 1 dag sedan
      } else {
        // Om det är fredag, använd idag
        friday = new Date(today);
      }
      
      // Söndag är alltid 2 dagar efter fredag
      sunday = new Date(friday);
      sunday.setDate(friday.getDate() + 2);
    } else {
      // Om det är måndag-torsdag (1-4) - välj NÄSTA helg
      const daysUntilFriday = 5 - currentDay;
      friday = new Date(today);
      friday.setDate(today.getDate() + daysUntilFriday);
      
      // Söndag är 2 dagar efter fredag
      sunday = new Date(friday);
      sunday.setDate(friday.getDate() + 2);
    }
    
    return { start: friday, end: sunday };
  };

  // Beräkna dagens datum (idag)
  const getTodayDates = () => {
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    return { start: todayStart, end: todayEnd };
  };

  // Beräkna denna veckas datum (måndag till söndag)
  const getThisWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = söndag, 1 = måndag, ..., 6 = lördag

    // Beräkna måndag denna vecka
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysFromMonday);
    monday.setHours(0, 0, 0, 0);

    // Söndag denna vecka
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { start: monday, end: sunday };
  };

  const quickFilters: QuickFilter[] = [
    {
      id: 'today',
      label: 'Idag',
      icon: Clock,
      type: 'date',
      dateRange: getTodayDates()
    },
    {
      id: 'weekend',
      label: 'I helgen',
      icon: Calendar,
      type: 'date',
      dateRange: getWeekendDates()
    },
    {
      id: 'this-week',
      label: 'Denna vecka',
      icon: Calendar,
      type: 'date',
      dateRange: getThisWeekDates()
    },
    {
      id: 'christmas',
      label: 'Till jul',
      icon: Snowflake,
      type: 'category',
      value: 'Jul'
    }
  ];

  const handleFilterClick = (filter: QuickFilter) => {
    posthog?.capture('quick_filter_clicked', {
      filter_id: filter.id,
      filter_label: filter.label,
      filter_type: filter.type,
    });
    
    onFilterApply(filter);
    // Rensa sökningen när man klickar på ett quick filter
    setSearchTerm("");
    onSearchChange("");
    // Vänta lite så att filtret hinner appliceras, sedan scrolla
    setTimeout(() => {
      onScrollToResults();
    }, 100);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearchChange(value);
    setIsDropdownOpen(value.length >= 2);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalItems = suggestions.length + (totalResults > 0 ? 1 : 0); // +1 för "Visa alla"
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSuggestionClick(suggestions[selectedIndex]);
      } else if (selectedIndex === suggestions.length && totalResults > 0) {
        handleShowAllResults();
      } else {
        setIsDropdownOpen(false);
        onScrollToResults();
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setSelectedIndex(-1);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    onSearchChange("");
    setIsDropdownOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <section className={`relative ${isDropdownOpen ? 'overflow-visible z-40' : 'overflow-hidden'}`}>
      {/* Background image with fade-out gradient */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/hero_jul.png')",
        }}
      >
        {/* Solid overlay that fades to background color - Mörkare i toppen för läsbarhet */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-[hsl(32,44%,96%)]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-16 pb-32">
        <div className="text-center mb-8">
          {/* Tipsa oss badge */}
          <div className="mb-8 animate-fade-in inline-block">
            <a
              href="/tips"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-300 hover:scale-105 group backdrop-blur-md"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'hsl(18 85% 65%)';
                e.currentTarget.style.color = 'hsl(18 85% 65%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.color = '#ffffff';
              }}
            >
              Tipsa oss om evenemang
              <MessageCircle className="h-3.5 w-3.5 ml-1 opacity-80 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
          
          {/* Rubrik med drop-shadow */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.8)]" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Vad händer i Varberg?
          </h1>

          {/* Ny underrubrik för bättre balans */}
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-12 font-medium drop-shadow-md leading-relaxed">
          Hitta evenemang som får hjärtat att slå lite snabbare.
          </p>
          
          {/* Quick Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-xs sm:max-w-2xl mx-auto px-4 sm:px-0">
            {quickFilters.map((filter) => {
              const IconComponent = filter.icon;
              
              return (
                <Button
                  key={filter.id}
                  onClick={() => handleFilterClick(filter)}
                  variant="outline"
                  size="lg"
                  className="flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 h-auto transition-all duration-200 shadow-lg hover:shadow-xl border w-full text-sm sm:text-base backdrop-blur-md"
                  style={{
                    backgroundColor: 'rgba(215, 235, 255, 0.45)', // Mer blåtonad glas-effekt
                    color: '#08075C',
                    borderColor: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(74, 144, 226, 0.9)'; // Starkare blå vid hover
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.9)';
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.transform = 'scale(1.02)'; // Liten förstoring
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(215, 235, 255, 0.45)'; // Tillbaka till blåtonad glas
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.7)';
                    e.currentTarget.style.color = '#08075C';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="font-medium truncate">{filter.label}</span>
                </Button>
              );
            })}
          </div>
          
          {/* Search Field with Autocomplete */}
          <div className="mt-6 max-w-xs sm:max-w-md mx-auto px-4 sm:px-0 relative">
            <form 
              action="#"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                if (searchTerm.trim()) {
                  posthog?.capture('search_performed', {
                    search_term: searchTerm,
                    results_count: totalResults,
                    search_method: 'form_submit',
                  });
                }
                setIsDropdownOpen(false);
                dismissKeyboard();
                setTimeout(() => onScrollToResults(), 150);
              }}
              className="relative"
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 pointer-events-none z-10" 
                style={{ color: '#08075C', opacity: 0.6 }} 
              />
              <input
                ref={inputRef}
                type="search"
                enterKeyHint="search"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => searchTerm.length >= 2 && setIsDropdownOpen(true)}
                placeholder="Hitta något roligt..."
                className="w-full pl-10 pr-10 py-3 text-base rounded-lg transition-all duration-200 shadow-lg focus:shadow-xl border backdrop-blur-md focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: isDropdownOpen ? 'rgba(255, 255, 255, 0.95)' : 'rgba(215, 235, 255, 0.45)',
                  color: '#08075C',
                  borderColor: isDropdownOpen ? 'rgba(74, 144, 226, 0.9)' : 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                  fontSize: '16px' // Förhindrar iOS zoom
                }}
                autoComplete="off"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:opacity-100 transition-opacity z-10"
                  style={{ color: '#08075C', opacity: 0.6 }}
                  aria-label="Rensa sökning"
                >
                  ✕
                </button>
              )}
            </form>
            
            {/* Autocomplete Dropdown */}
            {isDropdownOpen && suggestions.length > 0 && (
              <div 
                ref={dropdownRef}
                className="absolute top-full left-0 right-0 mt-2 rounded-lg overflow-hidden shadow-2xl border"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  borderColor: 'rgba(74, 144, 226, 0.3)',
                  backdropFilter: 'blur(16px)',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  zIndex: 9999
                }}
              >
                {/* Kategorier */}
                {suggestions.filter(s => s.type === 'category').length > 0 && (
                  <div className="px-3 pt-3 pb-1">
                    <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#08075C', opacity: 0.5 }}>
                      Kategorier
                    </div>
                    {suggestions.filter(s => s.type === 'category').map((suggestion, idx) => {
                      const globalIndex = suggestions.findIndex(s => s === suggestion);
                      return (
                        <button
                          key={`cat-${idx}`}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors ${
                            selectedIndex === globalIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                          style={{ color: '#08075C' }}
                        >
                          <Tag className="h-4 w-4 flex-shrink-0" style={{ color: '#4A90E2' }} />
                          <span className="font-medium flex-1">
                            {suggestion.label}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(74, 144, 226, 0.1)', color: '#4A90E2' }}>
                            {suggestion.count} event
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {/* Platser */}
                {suggestions.filter(s => s.type === 'venue').length > 0 && (
                  <div className="px-3 pt-3 pb-1 border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                    <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#08075C', opacity: 0.5 }}>
                      Platser
                    </div>
                    {suggestions.filter(s => s.type === 'venue').map((suggestion, idx) => {
                      const globalIndex = suggestions.findIndex(s => s === suggestion);
                      return (
                        <button
                          key={`venue-${idx}`}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors ${
                            selectedIndex === globalIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                          style={{ color: '#08075C' }}
                        >
                          <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: '#E87C3E' }} />
                          <span className="font-medium flex-1">
                            {suggestion.label}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(232, 124, 62, 0.1)', color: '#E87C3E' }}>
                            {suggestion.count} event
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {/* Evenemang */}
                {suggestions.filter(s => s.type === 'event').length > 0 && (
                  <div className="px-3 pt-3 pb-1 border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                    <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#08075C', opacity: 0.5 }}>
                      Evenemang
                    </div>
                    {suggestions.filter(s => s.type === 'event').map((suggestion, idx) => {
                      const globalIndex = suggestions.findIndex(s => s === suggestion);
                      return (
                        <button
                          key={`event-${idx}`}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors ${
                            selectedIndex === globalIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                          style={{ color: '#08075C' }}
                        >
                          <Ticket className="h-4 w-4 flex-shrink-0" style={{ color: '#22C55E' }} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {suggestion.label}
                            </div>
                            {suggestion.subLabel && (
                              <div className="text-xs truncate" style={{ color: '#08075C', opacity: 0.6 }}>
                                {suggestion.subLabel}
                              </div>
                            )}
                          </div>
                          <span className="text-xs" style={{ color: '#08075C', opacity: 0.4 }}>→</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {/* Visa alla resultat */}
                {totalResults > 0 && (
                  <button
                    onClick={handleShowAllResults}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 border-t transition-colors ${
                      selectedIndex === suggestions.length ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    style={{ 
                      borderColor: 'rgba(0,0,0,0.05)',
                      color: '#4A90E2'
                    }}
                  >
                    <Search className="h-4 w-4" />
                    <span className="font-medium">Visa alla {totalResults} resultat</span>
                  </button>
                )}
              </div>
            )}
            
            {/* Ingen träff */}
            {isDropdownOpen && searchTerm.length >= 2 && suggestions.length === 0 && (
              <div 
                ref={dropdownRef}
                className="absolute top-full left-0 right-0 mt-2 rounded-lg overflow-hidden shadow-2xl border p-4 text-center"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  borderColor: 'rgba(74, 144, 226, 0.3)',
                  backdropFilter: 'blur(16px)',
                  color: '#08075C',
                  zIndex: 9999
                }}
              >
                <p className="text-sm" style={{ opacity: 0.7 }}>
                  Inga träffar för "{searchTerm}"
                </p>
                <p className="text-xs mt-1" style={{ opacity: 0.5 }}>
                  Prova att söka på en kategori eller plats
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Wave Divider */}
      <div className={`absolute bottom-0 left-0 right-0 translate-y-1 pointer-events-none ${isDropdownOpen ? 'z-0' : 'z-20'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto block" style={{ minHeight: '80px' }}>
          <path fill="hsl(32 44% 96%)" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </section>
  );
}