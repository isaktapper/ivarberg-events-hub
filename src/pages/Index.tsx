import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategoryScroller } from "@/components/CategoryScroller";
import { EventList } from "@/components/EventList";
import { DateFilter } from "@/components/DateFilter";
import { LocationFilter } from "@/components/LocationFilter";
import { Footer } from "@/components/Footer";
import { LocalBusinessSchema } from "@/components/LocalBusinessSchema";
import { FAQSchema } from "@/components/FAQSchema";
import { getPublishedEvents } from "@/services/eventService";
import { EventCategory, EventDisplay, hasCategory, EVENT_AREAS, eventMatchesArea } from "@/types/event";
import { addTestEventsToState } from "@/testMultiCategoryEvents";
import { categoriesToUrl, urlToCategories } from "@/lib/categoryUrls";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<EventDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | undefined>(undefined);
  const [selectedLocation, setSelectedLocation] = useState("Hela Varberg");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 10;
  const resultsRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Handle URL parameters - restore filters from URL on page load
  useEffect(() => {
    // Read date or date range from URL
    const dateParam = searchParams.get('date');
    const dateStartParam = searchParams.get('dateStart');
    const dateEndParam = searchParams.get('dateEnd');
    
    if (dateStartParam && dateEndParam) {
      setDateRange({
        start: new Date(dateStartParam),
        end: new Date(dateEndParam)
      });
    } else if (dateParam) {
      setSelectedDate(new Date(dateParam));
    }

    // Read location from URL (only known areas are accepted)
    const locationParam = searchParams.get('location');
    if (locationParam && (EVENT_AREAS as readonly string[]).includes(locationParam)) {
      setSelectedLocation(locationParam);
    }

    // Read page from URL
    const pageParam = searchParams.get('page');
    if (pageParam) {
      const pageNum = parseInt(pageParam, 10);
      if (pageNum > 0) {
        setCurrentPage(pageNum);
      }
    }
  }, []); // Only run once on mount

  // Synka sök och kategorier från URL:en - körs både vid mount och när
  // t.ex. header-sökningen navigerar hit med nya parametrar
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== searchTerm) {
      setSearchTerm(urlSearch);
      if (urlSearch) {
        setCurrentPage(1);
        setTimeout(() => scrollToResults(), 150);
      }
    }

    const urlCategories = urlToCategories(searchParams.get('cat'));
    if (JSON.stringify(urlCategories) !== JSON.stringify(selectedCategories)) {
      setSelectedCategories(urlCategories);
      if (urlCategories.length > 0) {
        setCurrentPage(1);
        setTimeout(() => scrollToResults(), 150);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Hämta events från Supabase
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const eventsData = await getPublishedEvents();
        
        // Lägg till test events i utvecklingsläge för multi-category testning
        if (eventsData.length === 0) {
          addTestEventsToState(setEvents);
        } else {
          setEvents(eventsData);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        // Fallback till test events om Supabase inte fungerar
        addTestEventsToState(setEvents);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleCategoryToggle = (category: EventCategory) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    
    setSelectedCategories(newCategories);
    
    // Update URL parameters with abbreviated categories (also resets page)
    updateUrlParams({ 'cat': categoriesToUrl(newCategories) });
    
    resetPagination();
  };

  // Alla filter utom område – används både för listan och för räknarna i områdesfiltret
  const preLocationEvents = useMemo(() => {
    let filteredEvents = [...events];

    // Search filter - söker i eventnamn, platsnamn, och arrangör
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filteredEvents = filteredEvents.filter((event) => {
        const titleMatch = event.title.toLowerCase().includes(searchLower);
        const venueMatch = event.venue_name?.toLowerCase().includes(searchLower) || false;
        const locationMatch = event.location.toLowerCase().includes(searchLower);
        const organizerMatch = event.organizer?.name.toLowerCase().includes(searchLower) || false;
        
        return titleMatch || venueMatch || locationMatch || organizerMatch;
      });
    }

    // Category filter - updated for multi-category support
    if (selectedCategories.length > 0) {
      filteredEvents = filteredEvents.filter((event) => {
        // Kolla nya multi-category systemet först
        if (event.categories && event.categories.length > 0) {
          return selectedCategories.some(category => event.categories!.includes(category));
        }
        // Fallback till gamla systemet
        return selectedCategories.includes(event.category!);
      });
    }

    // Date filter
    if (dateRange) {
      filteredEvents = filteredEvents.filter((event) => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        const startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        return eventDate >= startDate && eventDate <= endDate;
      });
    } else if (selectedDate) {
      filteredEvents = filteredEvents.filter((event) => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        const filterDate = new Date(selectedDate);
        filterDate.setHours(0, 0, 0, 0);
        // Kontrollera att det är samma dag (inte >= utan exakt samma datum)
        return eventDate.getTime() === filterDate.getTime();
      });
    }

    return filteredEvents;
  }, [events, selectedCategories, selectedDate, dateRange, searchTerm]);

  // Location filter ("Hela Varberg" = inget filter)
  const filteredEvents = useMemo(() => {
    if (selectedLocation === "Hela Varberg") return preLocationEvents;
    return preLocationEvents.filter((event) => eventMatchesArea(event, selectedLocation));
  }, [preLocationEvents, selectedLocation]);

  // Antal events per område, med övriga filter applicerade (visas i områdesfiltret)
  const areaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const area of EVENT_AREAS) {
      counts[area] = preLocationEvents.filter((event) => eventMatchesArea(event, area)).length;
    }
    return counts;
  }, [preLocationEvents]);

  // Pagination logic
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
  const startIndex = (currentPage - 1) * eventsPerPage;
  const endIndex = startIndex + eventsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const resetPagination = () => {
    setCurrentPage(1);
    // Note: page param is removed via updateUrlParams when filters change
  };



  // Helper function to update URL params (also resets page when filters change)
  const updateUrlParams = (updates: Record<string, string | null>, resetPage: boolean = true) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    // Reset page when filters change
    if (resetPage) {
      newParams.delete('page');
    }
    setSearchParams(newParams);
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    setDateRange(undefined); // Clear range when selecting single date
    
    // Update URL
    if (date) {
      updateUrlParams({
        'date': date.toISOString().split('T')[0],
        'dateStart': null,
        'dateEnd': null
      });
    } else {
      // Clear all date-related URL params when date is cleared
      updateUrlParams({ 'date': null, 'dateStart': null, 'dateEnd': null });
    }
    
    resetPagination();
  };

  const handleDateRangeChange = (range: { start: Date; end: Date } | undefined) => {
    setDateRange(range);
    
    // Only clear single date and update URL when actually setting a range
    if (range) {
      setSelectedDate(undefined); // Clear single date when selecting range
      updateUrlParams({
        'dateStart': range.start.toISOString().split('T')[0],
        'dateEnd': range.end.toISOString().split('T')[0],
        'date': null
      });
      resetPagination();
    }
    // When range is undefined (cleared), don't touch selectedDate or URL
    // as it's likely being called alongside onDateChange
  };

  // Dagens events för "Händer idag"-sektionen. Korten visar endast events
  // som inte redan passerat tidsmässigt (heldagsevent, kl 00:00, visas hela
  // dagen) - finns inga kvar renderas inte sektionen alls. totalToday räknar
  // hela dagen och styr "Visa alla"-knappen, eftersom Idag-filtret den
  // applicerar visar dagens samtliga events.
  const { upcomingTodayEvents, totalTodayCount } = useMemo(() => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const allToday = events.filter((event) => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === today.getTime();
    });
    const upcoming = allToday.filter(
      (event) => !event.time || event.date.getTime() >= now.getTime()
    );
    return { upcomingTodayEvents: upcoming, totalTodayCount: allToday.length };
  }, [events]);

  const hasActiveFilters =
    selectedCategories.length > 0 || !!selectedDate || !!dateRange || !!searchTerm.trim() ||
    selectedLocation !== "Hela Varberg";

  const handleShowAllToday = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    handleQuickFilter({ id: 'today', type: 'date', dateRange: { start, end } });
    setTimeout(() => scrollToResults(), 100);
  };

  const handleQuickFilter = (filter: any) => {
    // Rensa andra filter först (inklusive sökning)
    setSelectedCategories([]);
    setSelectedDate(undefined);
    setDateRange(undefined);
    setSearchTerm("");
    
    // Build new URL params
    const newParams: Record<string, string | null> = {
      'cat': null,
      'search': null,
      'date': null,
      'dateStart': null,
      'dateEnd': null,
      'location': null
    };
    
    if (filter.type === 'date' && filter.dateRange) {
      setDateRange(filter.dateRange);
      newParams['dateStart'] = filter.dateRange.start.toISOString().split('T')[0];
      newParams['dateEnd'] = filter.dateRange.end.toISOString().split('T')[0];
    } else if (filter.type === 'category' && filter.value) {
      setSelectedCategories([filter.value]);
      newParams['cat'] = categoriesToUrl([filter.value]);
    }
    
    updateUrlParams(newParams);
    resetPagination();
  };

  const scrollToResults = () => {
    if (resultsRef.current) {
      const offset = 100; // Extra offset för att scrolla längre ner
      const elementPosition = resultsRef.current.offsetTop;
      const offsetPosition = elementPosition + offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Funktion för att byta sida och scrolla till datum/platsfilter
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    
    // Save page to URL
    const newSearchParams = new URLSearchParams(searchParams);
    if (page === 1) {
      newSearchParams.delete('page');
    } else {
      newSearchParams.set('page', page.toString());
    }
    setSearchParams(newSearchParams);
    
    // Scrolla till datum/plats-filter sektionen
    if (filtersRef.current) {
      const elementPosition = filtersRef.current.offsetTop;
      const offset = -100; // Offset för att ge lite luft och visa kategorierna också
      const offsetPosition = elementPosition + offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Dynamic SEO metadata based on filters
  const getPageTitle = () => {
    if (selectedCategories.length === 1) {
      return `${selectedCategories[0]} Evenemang i Varberg | ivarberg.nu`;
    }
    if (selectedDate) {
      return `Evenemang i Varberg ${selectedDate.toLocaleDateString('sv-SE')} | ivarberg.nu`;
    }
    if (dateRange) {
      return `Evenemang i Varberg - Kommande händelser | ivarberg.nu`;
    }
    return 'Evenemang i Varberg - Din kompletta eventkalender | ivarberg.nu';
  };

  const getPageDescription = () => {
    if (selectedCategories.length === 1) {
      return `Upptäck alla ${selectedCategories[0]} evenemang i Varberg. Hitta konserter, teater, sport och aktiviteter. Uppdateras dagligen med nya evenemang.`;
    }
    if (selectedDate) {
      return `Se alla evenemang i Varberg ${selectedDate.toLocaleDateString('sv-SE')}. Fullständig översikt över vad som händer i Varberg idag och framåt.`;
    }
    return 'Din kompletta guide till Varbergs evenemang. Upptäck konserter, teater, sport, restauranger och aktiviteter för hela familjen. Uppdateras dagligen!';
  };

  const getH1Text = () => {
    if (selectedCategories.length === 1) {
      return `${selectedCategories[0]} Evenemang i Varberg`;
    }
    if (selectedDate) {
      return `Evenemang i Varberg ${selectedDate.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }
    return 'Evenemang i Varberg - Upptäck vad som händer';
  };

  return (
    <>
      <Helmet>
        <title>{getPageTitle()}</title>
        <meta name="description" content={getPageDescription()} />
        <meta name="keywords" content="evenemang Varberg, Varberg event, att göra Varberg, vad göra Varberg, Varberg kalender, events Varberg, Varberg aktiviteter" />
        
        {/* Open Graph */}
        <meta property="og:title" content={getPageTitle()} />
        <meta property="og:description" content={getPageDescription()} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ivarberg.nu" />
        <meta property="og:image" content="https://ivarberg.nu/og-image.jpg" />
        <meta property="og:locale" content="sv_SE" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={getPageTitle()} />
        <meta name="twitter:description" content={getPageDescription()} />
        <meta name="twitter:image" content="https://ivarberg.nu/og-image.jpg" />
        
        <link rel="canonical" href="https://ivarberg.nu/" />
      </Helmet>
      
      {/* Structured Data */}
      <LocalBusinessSchema />
      <FAQSchema />

      <div className="min-h-screen bg-texture">
        <Header />
      <Hero
        onFilterApply={handleQuickFilter}
        onScrollToResults={scrollToResults}
        events={events}
      />
      
      {/* Händer idag - teaser direkt under hero (visas bara utan aktiva filter) */}
      {!loading && !hasActiveFilters && upcomingTodayEvents.length > 0 && (
        <section className="container mx-auto px-4 pt-2 pb-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center" style={{ color: '#10214B' }}>
            Detta händer idag
          </h2>
          <EventList events={upcomingTodayEvents.slice(0, 3)} />
          {totalTodayCount > 3 && (
            <div className="text-center mt-4">
              <button
                onClick={handleShowAllToday}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{
                  color: '#10214B',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #10214B'
                }}
              >
                Visa alla {totalTodayCount} evenemang idag
              </button>
            </div>
          )}
        </section>
      )}

      <main className="container mx-auto px-4 pt-6 pb-12" ref={resultsRef}>
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center" style={{ color: '#10214B' }}>{getH1Text()}</h2>
          
          {/* Category Scroller */}
          <div>
            <CategoryScroller
              selectedCategories={selectedCategories}
              onCategoryToggle={handleCategoryToggle}
            />
          </div>
          
          {/* Date and Location Filters */}
          <div ref={filtersRef} className="flex flex-col items-center mt-6">
            <div className="flex items-center gap-3">
              <DateFilter 
                selectedDate={selectedDate}
                dateRange={dateRange}
                onDateChange={handleDateChange}
                onDateRangeChange={handleDateRangeChange}
              />
              <LocationFilter
                selectedLocation={selectedLocation}
                areaCounts={areaCounts}
                onLocationChange={(location) => {
                  setSelectedLocation(location);
                  updateUrlParams({ 'location': location !== "Hela Varberg" ? location : null });
                  resetPagination();
                }}
              />
            </div>
            
            {/* Clear Filters */}
            <button
              onClick={() => {
                setSelectedCategories([]);
                setSelectedDate(undefined);
                setDateRange(undefined);
                setSelectedLocation("Hela Varberg");
                setSearchTerm("");
                setSearchParams({}); // Clear all URL parameters
                resetPagination();
              }}
              className="text-sm mt-3 transition-colors cursor-pointer"
              style={{
                color: (selectedCategories.length > 0 || selectedDate || dateRange || selectedLocation !== "Hela Varberg" || searchTerm)
                  ? '#0F5AA6' 
                  : '#10214B',
                opacity: (selectedCategories.length > 0 || selectedDate || dateRange || selectedLocation !== "Hela Varberg" || searchTerm)
                  ? 1 
                  : 0.5
              }}
            >
              Rensa filter
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#0F5AA6' }}></div>
            <p className="mt-4" style={{ color: '#10214B' }}>Laddar evenemang...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ color: '#10214B' }}>Inga evenemang hittades.</p>
            <p className="text-sm mt-2" style={{ color: '#10214B', opacity: 0.7 }}>
              Kontrollera att du har lagt till evenemang i databasen och att de har status 'published'.
            </p>
          </div>
        ) : (
          <EventList events={paginatedEvents} activeFilter={selectedCategories.length === 1 ? selectedCategories[0] : null} />
        )}
        
        {/* Pagination - Mobile First */}
        {totalPages > 1 && (
          <div className="mt-8 space-y-4">
            {/* Mobile: Simple navigation */}
            <div className="flex items-center justify-between sm:hidden px-4">
              <button
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  color: '#10214B',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #10214B'
                }}
              >
                ‹ Föregående
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: '#10214B', opacity: 0.7 }}>
                  Sida {currentPage} av {totalPages}
                </span>
              </div>

              <button
                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  color: '#10214B',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #10214B'
                }}
              >
                Nästa ›
              </button>
            </div>
            
            {/* Desktop: Traditional pagination */}
            <div className="hidden sm:flex justify-center items-center gap-3">
              <button
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  color: '#10214B',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #10214B'
                }}
              >
                Föregående
              </button>

              <div className="flex items-center gap-2">
                {(() => {
                  const pages = [];
                  const maxVisible = 5;

                  if (totalPages <= maxVisible) {
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    // Alltid visa första sidan
                    pages.push(1);

                    if (currentPage > 3) {
                      pages.push('...');
                    }

                    // Visa sidor runt current page
                    const start = Math.max(2, currentPage - 1);
                    const end = Math.min(totalPages - 1, currentPage + 1);

                    for (let i = start; i <= end; i++) {
                      if (!pages.includes(i)) {
                        pages.push(i);
                      }
                    }

                    if (currentPage < totalPages - 2) {
                      pages.push('...');
                    }

                    // Alltid visa sista sidan
                    if (!pages.includes(totalPages)) {
                      pages.push(totalPages);
                    }
                  }

                  return pages.map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-2 text-sm" style={{ color: '#10214B', opacity: 0.5 }}>
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page as number)}
                        className="w-10 h-10 text-sm font-medium rounded-lg transition-colors"
                        style={{
                          backgroundColor: currentPage === page ? '#0F5AA6' : '#FFFFFF',
                          color: currentPage === page ? '#FFFFFF' : '#10214B',
                          border: `1px solid ${currentPage === page ? '#0F5AA6' : '#10214B'}`
                        }}
                      >
                        {page}
                      </button>
                    )
                  ));
                })()}
              </div>

              <button
                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  color: '#10214B',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #10214B'
                }}
              >
                Nästa
              </button>
            </div>
          </div>
        )}
        
        {/* Results info */}
        <div className="text-center text-sm mt-4" style={{ color: '#10214B', opacity: 0.7 }}>
          Visar {startIndex + 1}-{Math.min(endIndex, filteredEvents.length)} av {filteredEvents.length} evenemang
        </div>
      </main>
      
      <Footer />
      </div>
    </>
  );
};

export default Index;
