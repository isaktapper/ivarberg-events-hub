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
import { getPublishedEvents, getAllEvents } from "@/services/eventService";
import { EventCategory, EventDisplay, hasCategory } from "@/types/event";
import { addTestEventsToState } from "@/testMultiCategoryEvents";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<EventDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | undefined>(undefined);
  const [selectedLocation, setSelectedLocation] = useState("Hela Varberg");
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 10;
  const resultsRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Handle URL parameters for category selection
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      // Validate that the category is a valid EventCategory
      const validCategories: EventCategory[] = [
        'Scen', 'Nattliv', 'Sport', 'Utställningar', 'Föreläsningar', 
        'Barn & Familj', 'Mat & Dryck', 'Jul', 'Film & bio', 
        'Djur & Natur', 'Guidade visningar', 'Marknader', 'Okategoriserad'
      ];
      
      if (validCategories.includes(categoryParam as EventCategory)) {
        setSelectedCategories([categoryParam as EventCategory]);
        // Scroll to categories section after a short delay
        setTimeout(() => {
          scrollToCategories();
        }, 100);
      }
    }
  }, [searchParams]);

  // Hämta events från Supabase
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        // DEBUG: Använd getAllEvents för att se alla events
        const eventsData = await getAllEvents();
        
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
    
    // Update URL parameters
    const newSearchParams = new URLSearchParams(searchParams);
    if (newCategories.length === 0) {
      newSearchParams.delete('category');
    } else if (newCategories.length === 1) {
      newSearchParams.set('category', newCategories[0]);
    } else {
      // For multiple categories, we could implement a different approach
      // For now, just use the first one
      newSearchParams.set('category', newCategories[0]);
    }
    setSearchParams(newSearchParams);
    
    resetPagination();
  };

  const filteredEvents = useMemo(() => {
    let filteredEvents = [...events];

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
  }, [events, selectedCategories, selectedDate, dateRange]);

  // Pagination logic
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
  const startIndex = (currentPage - 1) * eventsPerPage;
  const endIndex = startIndex + eventsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const resetPagination = () => {
    setCurrentPage(1);
  };



  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    resetPagination();
  };

  const handleDateRangeChange = (range: { start: Date; end: Date } | undefined) => {
    setDateRange(range);
    resetPagination();
  };

  const handleQuickFilter = (filter: any) => {
    // Rensa andra filter först
    setSelectedCategories([]);
    setSelectedDate(undefined);
    setDateRange(undefined);
    
    if (filter.type === 'date' && filter.dateRange) {
      setDateRange(filter.dateRange);
    } else if (filter.type === 'category' && filter.value) {
      setSelectedCategories([filter.value]);
    }
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

  const scrollToCategories = () => {
    if (categoriesRef.current) {
      const offset = -80; // Negativ offset för att inte scrolla för långt
      const elementPosition = categoriesRef.current.offsetTop;
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
        <meta property="og:image" content="https://ivarberg.nu/varberg_hero.jpg" />
        <meta property="og:locale" content="sv_SE" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={getPageTitle()} />
        <meta name="twitter:description" content={getPageDescription()} />
        <meta name="twitter:image" content="https://ivarberg.nu/varberg_hero.jpg" />
        
        <link rel="canonical" href="https://ivarberg.nu" />
      </Helmet>
      
      {/* Structured Data */}
      <LocalBusinessSchema />
      <FAQSchema />

      <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
        <Header />
      <Hero 
        onFilterApply={handleQuickFilter}
        onScrollToResults={scrollToResults}
        onScrollToCategories={scrollToCategories}
      />
      
      <main className="container mx-auto px-4 pt-6 pb-12" ref={resultsRef}>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center" style={{ color: '#08075C' }}>{getH1Text()}</h1>
          
          {/* Category Scroller */}
          <div ref={categoriesRef}>
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
                onLocationChange={(location) => {
                  setSelectedLocation(location);
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
                setSearchParams({}); // Clear all URL parameters
                resetPagination();
              }}
              className="text-sm mt-3 transition-colors cursor-pointer"
              style={{
                color: (selectedCategories.length > 0 || selectedDate || dateRange || selectedLocation !== "Hela Varberg")
                  ? '#4A90E2' 
                  : '#08075C',
                opacity: (selectedCategories.length > 0 || selectedDate || dateRange || selectedLocation !== "Hela Varberg")
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
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#4A90E2' }}></div>
            <p className="mt-4" style={{ color: '#08075C' }}>Laddar evenemang...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ color: '#08075C' }}>Inga evenemang hittades.</p>
            <p className="text-sm mt-2" style={{ color: '#08075C', opacity: 0.7 }}>
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
                  color: '#08075C',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #08075C'
                }}
              >
                ‹ Föregående
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: '#08075C', opacity: 0.7 }}>
                  Sida {currentPage} av {totalPages}
                </span>
              </div>

              <button
                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  color: '#08075C',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #08075C'
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
                  color: '#08075C',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #08075C'
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
                      <span key={`ellipsis-${index}`} className="px-2 text-sm" style={{ color: '#08075C', opacity: 0.5 }}>
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page as number)}
                        className="w-10 h-10 text-sm font-medium rounded-lg transition-colors"
                        style={{
                          backgroundColor: currentPage === page ? '#4A90E2' : '#FFFFFF',
                          color: currentPage === page ? '#FFFFFF' : '#08075C',
                          border: `1px solid ${currentPage === page ? '#4A90E2' : '#08075C'}`
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
                  color: '#08075C',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #08075C'
                }}
              >
                Nästa
              </button>
            </div>
          </div>
        )}
        
        {/* Results info */}
        <div className="text-center text-sm mt-4" style={{ color: '#08075C', opacity: 0.7 }}>
          Visar {startIndex + 1}-{Math.min(endIndex, filteredEvents.length)} av {filteredEvents.length} evenemang
        </div>
      </main>
      
      <Footer />
      </div>
    </>
  );
};

export default Index;
