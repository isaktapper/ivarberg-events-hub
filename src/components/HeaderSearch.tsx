import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Tag, MapPin, Ticket } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { EventCategory, EventDisplay } from "@/types/event";
import { getAllEvents } from "@/services/eventService";
import { CATEGORY_TO_ABBREV } from "@/lib/categoryUrls";

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

// Eventlistan hämtas lazy första gången sökfältet öppnas och cachas
// under sessionen så att headern inte laddar data i onödan.
let cachedEvents: EventDisplay[] | null = null;

export function HeaderSearchTrigger({ onClick, showLabel = false }: { onClick: () => void; showLabel?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Sök evenemang"
      className={`relative z-20 flex items-center gap-1.5 px-2 py-2 text-sm font-medium transition-colors cursor-pointer ${
        showLabel ? 'text-neutral-600 hover:text-[#08075C]' : 'text-black'
      }`}
    >
      <Search className={showLabel ? "h-5 w-5" : "h-6 w-6"} />
      {showLabel && <span>Sök</span>}
    </button>
  );
}

export function HeaderSearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [events, setEvents] = useState<EventDisplay[]>(cachedEvents ?? []);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const posthog = usePostHog();

  useEffect(() => {
    if (!open) return;
    posthog?.capture('header_search_opened');
    if (!cachedEvents) {
      getAllEvents()
        .then((data) => {
          cachedEvents = data;
          setEvents(data);
        })
        .catch(() => {});
    }
    // Kort fördröjning så fokus hamnar rätt efter render
    setTimeout(() => inputRef.current?.focus(), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Hitta förslag baserat på söktermen (samma logik som tidigare i Hero)
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
    const normalizeVenueName = (name: string): string => {
      return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Ta bort accenter
        .replace(/[^a-z0-9\s]/g, '') // Ta bort specialtecken
        .trim();
    };

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

    Array.from(normalizedVenueMap.entries())
      .sort((a, b) => b[1].totalCount - a[1].totalCount)
      .slice(0, 3) // Max 3 platser
      .forEach(([_, { originalNames, totalCount }]) => {
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

  const close = () => {
    setSearchTerm("");
    setSelectedIndex(-1);
    onClose();
  };

  const goTo = (path: string) => {
    close();
    navigate(path);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    posthog?.capture('search_suggestion_clicked', {
      search_term: searchTerm,
      suggestion_type: suggestion.type,
      suggestion_label: suggestion.label,
      suggestion_count: suggestion.count,
      source: 'header',
    });

    if (suggestion.type === 'category' && suggestion.category) {
      goTo(`/?cat=${CATEGORY_TO_ABBREV[suggestion.category]}`);
    } else if (suggestion.type === 'venue') {
      goTo(`/?search=${encodeURIComponent(suggestion.label)}`);
    } else if (suggestion.type === 'event' && suggestion.eventId) {
      goTo(`/event/${suggestion.eventId}`);
    }
  };

  const handleSubmit = () => {
    if (!searchTerm.trim()) return;
    posthog?.capture('search_performed', {
      search_term: searchTerm,
      results_count: totalResults,
      search_method: 'header',
    });
    goTo(`/?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalItems = suggestions.length + (totalResults > 0 ? 1 : 0); // +1 för "Visa alla"

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      close();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={close} />

      <div className="relative mx-auto mt-3 w-[calc(100%-2rem)] max-w-xl">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
              handleSuggestionClick(suggestions[selectedIndex]);
            } else {
              handleSubmit();
            }
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
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Hitta något roligt..."
            className="w-full pl-10 pr-10 py-3 text-base rounded-lg border bg-white shadow-2xl focus:outline-none focus:ring-2 [&::-webkit-search-cancel-button]:hidden"
            style={{
              color: '#08075C',
              borderColor: 'rgba(74, 144, 226, 0.9)',
              fontSize: '16px' // Förhindrar iOS zoom
            }}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={close}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:opacity-100 transition-opacity z-10"
            style={{ color: '#08075C', opacity: 0.6 }}
            aria-label="Stäng sökning"
          >
            ✕
          </button>
        </form>

        {/* Autocomplete Dropdown */}
        {suggestions.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 mt-2 rounded-lg overflow-hidden shadow-2xl border"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              borderColor: 'rgba(74, 144, 226, 0.3)',
              backdropFilter: 'blur(16px)',
              maxHeight: '60vh',
              overflowY: 'auto'
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
                onClick={handleSubmit}
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
        {searchTerm.length >= 2 && suggestions.length === 0 && (
          <div
            className="absolute top-full left-0 right-0 mt-2 rounded-lg overflow-hidden shadow-2xl border p-4 text-center"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              borderColor: 'rgba(74, 144, 226, 0.3)',
              backdropFilter: 'blur(16px)',
              color: '#08075C'
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
  );
}
