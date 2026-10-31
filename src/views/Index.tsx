"use client";

import { Fragment, useState, useMemo, useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import { useSearchParams } from "@/lib/router";
import { Helmet } from "@/lib/helmet";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { EventRow } from "@/components/home/EventRow";
import { EventListRow } from "@/components/home/EventListRow";
import { addDays, dayHeading, startOfDay, ymd, type HomeRow } from "@/lib/homeRows";
import { DateFilter } from "@/components/DateFilter";
import { LocationFilter } from "@/components/LocationFilter";
import { Footer } from "@/components/Footer";
import { LocalBusinessSchema } from "@/components/LocalBusinessSchema";
import { FAQSchema } from "@/components/FAQSchema";
import { InstagramPromoCard } from "@/components/InstagramPromoCard";
import { InstagramPromoDialog } from "@/components/InstagramPromoDialog";
import { useInstagramPromo } from "@/hooks/useInstagramPromo";
import { getSortableDate, isEventStillRelevant } from "@/services/eventService";
import { EventCategory, EventDisplay, hasCategory, EVENT_AREAS, eventMatchesArea } from "@/types/event";
import { addTestEventsToState } from "@/testMultiCategoryEvents";
import { categoriesToUrl, urlToCategories } from "@/lib/categoryUrls";
import { HALLOWEEN_THEME, isHalloweenEvent } from "@/lib/seasonal";

// Antal evenemang i listan innan "Visa fler"
const LIST_PAGE_SIZE = 20;

// Kategorifiltret i "Alla evenemang" (samma urval som den tidigare kategoriraden)
const CATEGORY_FILTERS: { id: EventCategory; label: string }[] = [
  { id: "Barn & Familj", label: "Barn & familj" },
  { id: "Scen", label: "Scen" },
  { id: "Sport", label: "Sport" },
  { id: "Nattliv", label: "Nattliv" },
  { id: "Mat & Dryck", label: "Mat & dryck" },
  { id: "Utställningar", label: "Utställningar" },
  { id: "Föreläsningar", label: "Föreläsningar" },
  { id: "Film & bio", label: "Film & bio" },
  { id: "Djur & Natur", label: "Djur & natur" },
  { id: "Marknader", label: "Marknader" },
  { id: "Guidade visningar", label: "Guidade visningar" },
];

interface IndexProps {
  // Hämtas på servern (src/app/page.tsx) så att listan finns i HTML:en direkt
  initialEvents: EventDisplay[];
  // Startsidans rader, framräknade på servern (src/lib/homeRows.ts)
  rows: HomeRow[];
}

const Index = ({ initialEvents, rows }: IndexProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<EventDisplay[]>(initialEvents);
  const [loading, setLoading] = useState(false);
  // Filtren initieras från URL:en redan vid serverrenderingen, så att en
  // delad filtrerad länk visar rätt lista från start
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>(() => urlToCategories(searchParams.get('cat')));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const dateParam = searchParams.get('date');
    return !searchParams.get('dateStart') && dateParam ? new Date(dateParam) : undefined;
  });
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | undefined>(() => {
    const start = searchParams.get('dateStart');
    const end = searchParams.get('dateEnd');
    return start && end ? { start: new Date(start), end: new Date(end) } : undefined;
  });
  const [selectedLocation, setSelectedLocation] = useState(() => {
    const locationParam = searchParams.get('location');
    return locationParam && (EVENT_AREAS as readonly string[]).includes(locationParam) ? locationParam : "Hela Varberg";
  });
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || "");
  // Temafilter läses direkt från URL:en (?tema=halloween)
  const theme = searchParams.get('tema');
  const [currentPage, setCurrentPage] = useState(() => {
    const pageNum = parseInt(searchParams.get('page') || '', 10);
    return pageNum > 0 ? pageNum : 1;
  });
  const eventsPerPage = 10;
  const resultsRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Instagram-promo A/B-test (inline-kort vs popup)
  const promo = useInstagramPromo();
  const [promoPopupOpen, setPromoPopupOpen] = useState(false);
  const promoSentinelRef = useRef<HTMLDivElement>(null);
  const popupTriggeredRef = useRef(false); // max en popup-visning per sidladdning
  const popupClickedRef = useRef(false); // exakt ett av clicked/dismissed per visning
  const inlineShownRef = useRef(false); // max en shown-event per sidladdning

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

  // Som tidigare: kommer man till startsidan med sökning eller kategori i
  // URL:en (t.ex. från header-sökningen) scrollas listan fram
  useEffect(() => {
    if (searchParams.get('search') || urlToCategories(searchParams.get('cat')).length > 0) {
      setTimeout(() => scrollToResults(), 150);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Events hämtas på servern. Testevents används som tidigare bara om
  // databasen inte gav något (utvecklingsläge / Supabase nere).
  useEffect(() => {
    if (initialEvents.length === 0) {
      addTestEventsToState(setEvents);
    }
  }, [initialEvents]);

  // Popup-varianten: öppna dialogen först när besökaren scrollat till promo-punkten
  // (samma plats i flödet som inline-kortet, för en rättvis A/B-jämförelse)
  useEffect(() => {
    if (!promo.showPopup || loading || popupTriggeredRef.current) return;

    const el = promoSentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting) && !popupTriggeredRef.current) {
        popupTriggeredRef.current = true;
        setPromoPopupOpen(true);
        promo.trackShown("home_feed");
        observer.disconnect();
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [promo.showPopup, promo.trackShown, loading, currentPage]);

  const handlePromoPopupOpenChange = (open: boolean) => {
    if (open) return;
    setPromoPopupOpen(false);
    if (!popupClickedRef.current) {
      promo.trackDismissed("home_feed");
    }
  };

  const handlePromoPopupClick = () => {
    popupClickedRef.current = true;
    promo.trackClicked("home_feed");
    setPromoPopupOpen(false);
  };

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

    // Temafilter (?tema=halloween)
    if (theme === HALLOWEEN_THEME) {
      filteredEvents = filteredEvents.filter((event) => isHalloweenEvent(event));
    }

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
  }, [events, selectedCategories, selectedDate, dateRange, searchTerm, theme]);

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

  // Dagens events för "Händer idag"-sektionen. Korten visar endast events som
  // fortfarande är relevanta (samma regel som listorna: starttid + 1h grace,
  // event utan tid döljs från kl 18) - finns inga kvar renderas inte sektionen
  // alls. totalToday räknar hela dagen och styr "Visa alla"-knappen, eftersom
  // Idag-filtret den applicerar visar dagens samtliga events.
  const { upcomingTodayEvents, totalTodayCount } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const allToday = events.filter((event) => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === today.getTime();
    });
    const upcoming = allToday.filter((event) => isEventStillRelevant(event));
    return { upcomingTodayEvents: upcoming, totalTodayCount: allToday.length };
  }, [events]);

  const hasActiveFilters =
    selectedCategories.length > 0 || !!selectedDate || !!dateRange || !!searchTerm.trim() || !!theme ||
    selectedLocation !== "Hela Varberg";

  // Temafilter från hero (t.ex. halloween) – rensar övriga filter och sätter ?tema=
  const handleThemeSelect = (theme: string) => {
    setSelectedCategories([]);
    setSelectedDate(undefined);
    setDateRange(undefined);
    setSearchTerm("");
    updateUrlParams({
      'cat': null,
      'search': null,
      'date': null,
      'dateStart': null,
      'dateEnd': null,
      'tema': theme
    });
    resetPagination();
    setTimeout(() => scrollToResults(), 100);
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
    if (theme === HALLOWEEN_THEME) {
      return 'Halloween i Varberg';
    }
    if (selectedCategories.length === 1) {
      return `${selectedCategories[0]} Evenemang i Varberg`;
    }
    if (selectedDate) {
      return `Evenemang i Varberg ${selectedDate.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }
    return 'Evenemang i Varberg - Upptäck vad som händer';
  };

  // ---- Nya startsidan: rader per period + "Alla evenemang" ----

  const posthog = usePostHog();
  const listRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(LIST_PAGE_SIZE);

  // Ny filtrering → börja om från första sidan av listan
  useEffect(() => {
    setVisibleCount(LIST_PAGE_SIZE);
  }, [selectedCategories, selectedDate, dateRange, searchTerm, theme, selectedLocation]);

  // Listan sorteras per dag och klockslag (raderna ovanför lyfter fram
  // utvalda). Evenemang utan känd tid hamnar sist under sin dag.
  const listEvents = useMemo(
    () =>
      [...filteredEvents].sort((a, b) => {
        const day = startOfDay(a.date).getTime() - startOfDay(b.date).getTime();
        if (day !== 0) return day;
        if (!a.time !== !b.time) return a.time ? -1 : 1;
        return getSortableDate(a.date) - getSortableDate(b.date);
      }),
    [filteredEvents]
  );

  const listGroups = useMemo(() => {
    const now = new Date();
    const groups: { key: string; label: string; dateShort: string; events: EventDisplay[] }[] = [];
    for (const event of listEvents.slice(0, visibleCount)) {
      const key = ymd(event.date);
      let group = groups[groups.length - 1];
      if (!group || group.key !== key) {
        group = { key, ...dayHeading(event.date, now), events: [] };
        groups.push(group);
      }
      group.events.push(event);
    }
    return groups;
  }, [listEvents, visibleCount]);

  const scrollToList = () => {
    setTimeout(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };

  // Datumintervall med lokala datum i URL:en (YYYY-MM-DD)
  const applyDateRange = (start: Date, end: Date) => {
    setSelectedDate(undefined);
    setDateRange({ start, end });
    updateUrlParams({ date: null, dateStart: ymd(start), dateEnd: ymd(end) });
  };

  const clearDates = () => {
    setSelectedDate(undefined);
    setDateRange(undefined);
    updateUrlParams({ date: null, dateStart: null, dateEnd: null });
  };

  const handleSeeAll = (row: HomeRow) => {
    applyDateRange(new Date(`${row.start}T00:00:00`), new Date(`${row.end}T00:00:00`));
    posthog?.capture("home_row_see_all_clicked", { row: row.key, count: row.count });
    scrollToList();
  };

  const today = startOfDay(new Date());
  const weekday = today.getDay();
  const weekendStart = weekday === 6 || weekday === 0 ? today : addDays(today, 5 - weekday);
  const weekendEnd = weekday === 0 ? today : addDays(weekendStart, weekday === 6 ? 1 : 2);
  const nextMonday = addDays(today, ((8 - weekday) % 7) || 7);
  const datePresets = [
    { key: "idag", label: "Idag", start: today, end: today },
    { key: "imorgon", label: "Imorgon", start: addDays(today, 1), end: addDays(today, 1) },
    { key: "helgen", label: "I helgen", start: weekendStart, end: weekendEnd },
    { key: "nasta-vecka", label: "Nästa vecka", start: nextMonday, end: addDays(nextMonday, 6) },
  ];
  const activePreset = dateRange
    ? datePresets.find((p) => ymd(p.start) === ymd(dateRange.start) && ymd(p.end) === ymd(dateRange.end))?.key
    : undefined;
  const noDateFilter = !dateRange && !selectedDate;

  const toggleCategory = (category: EventCategory) => {
    const selected = !selectedCategories.includes(category);
    posthog?.capture("category_clicked", {
      category,
      action: selected ? "selected" : "deselected",
      selected_categories_count: selectedCategories.length + (selected ? 1 : -1),
    });
    handleCategoryToggle(category);
  };

  const clearCategories = () => {
    setSelectedCategories([]);
    updateUrlParams({ cat: null });
  };

  const pillClass = (active: boolean) =>
    `min-h-9 shrink-0 whitespace-nowrap rounded-full px-3.5 text-[13.5px] font-semibold transition-colors ${
      active ? "bg-ink text-white" : "bg-[#F4F5F7] text-ink hover:bg-[#E9ECF0]"
    }`;

  const listTitle = theme === HALLOWEEN_THEME ? "Halloween i Varberg" : "Alla evenemang";

  const promoSlot = promo.showInline ? (
    <InstagramPromoCard
      onShown={() => {
        if (!inlineShownRef.current) {
          inlineShownRef.current = true;
          promo.trackShown("home_feed");
        }
      }}
      onClick={() => promo.trackClicked("home_feed")}
    />
  ) : promo.showPopup ? (
    // Osynlig sentinel på inline-kortets plats – triggar popupen vid scroll
    <div ref={promoSentinelRef} aria-hidden className="h-0" />
  ) : null;

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

      <div className="min-h-screen bg-white">
        <Header />
        <Hero
          onThemeSelect={handleThemeSelect}
          events={events}
        />

        <main className="flex flex-col gap-8 pb-12 lg:gap-12 lg:pt-2">
          {/* Rader per period – döljs när man filtrerar eller söker */}
          {!hasActiveFilters &&
            rows.map((row) => <EventRow key={row.key} row={row} onSeeAll={handleSeeAll} />)}

          {/* Alla evenemang */}
          <section
            id="alla-evenemang"
            ref={listRef}
            className="mx-auto flex w-full max-w-[1280px] scroll-mt-24 flex-col gap-3.5 pt-2 lg:gap-6 lg:px-10 lg:pt-4"
          >
            <div className="flex items-baseline justify-between gap-4 px-4 lg:px-0" ref={resultsRef}>
              <h2 className="text-2xl font-bold leading-tight text-ink lg:text-[28px]">
                {listTitle} <span className="font-medium text-ink-soft">{filteredEvents.length}</span>
              </h2>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategories([]);
                    setSelectedDate(undefined);
                    setDateRange(undefined);
                    setSelectedLocation("Hela Varberg");
                    setSearchTerm("");
                    setSearchParams({});
                  }}
                  className="shrink-0 text-sm font-semibold text-sea hover:text-sea-dark"
                >
                  Rensa filter
                </button>
              )}
            </div>

            {searchTerm.trim() && (
              <p className="px-4 text-sm text-ink-soft lg:px-0">
                Sökresultat för <span className="font-semibold text-ink">”{searchTerm.trim()}”</span>
              </p>
            )}

            <div className="flex flex-col gap-3.5 lg:flex-row lg:items-start lg:gap-10">
              {/* Filter: knappar + kategorirad på mobil, panel till vänster på dator */}
              <div className="flex gap-2 px-4 lg:hidden" ref={filtersRef}>
                <div className="flex-1">
                  <DateFilter
                    variant="plain"
                    selectedDate={selectedDate}
                    dateRange={dateRange}
                    onDateChange={handleDateChange}
                    onDateRangeChange={handleDateRangeChange}
                  />
                </div>
                <div className="flex-1">
                  <LocationFilter
                    variant="plain"
                    selectedLocation={selectedLocation}
                    areaCounts={areaCounts}
                    onLocationChange={(location) => {
                      setSelectedLocation(location);
                      updateUrlParams({ location: location !== "Hela Varberg" ? location : null });
                    }}
                  />
                </div>
              </div>
              <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 lg:hidden">
                <button type="button" className={pillClass(selectedCategories.length === 0)} onClick={clearCategories}>
                  Alla
                </button>
                {CATEGORY_FILTERS.map((c) => (
                  <button key={c.id} type="button" className={pillClass(selectedCategories.includes(c.id))} onClick={() => toggleCategory(c.id)}>
                    {c.label}
                  </button>
                ))}
              </div>

              <aside className="hidden w-[260px] shrink-0 flex-col gap-7 lg:flex">
                <div className="flex flex-col gap-2.5">
                  <h3 className="text-[15px] font-bold leading-5 text-ink">Datum</h3>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={pillClass(noDateFilter)} onClick={clearDates}>
                      Alla datum
                    </button>
                    {datePresets.map((p) => (
                      <button key={p.key} type="button" className={pillClass(activePreset === p.key)} onClick={() => applyDateRange(p.start, p.end)}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <DateFilter
                    variant="plain"
                    plainLabel={noDateFilter || activePreset ? "Välj datum…" : undefined}
                    selectedDate={selectedDate}
                    dateRange={dateRange}
                    onDateChange={handleDateChange}
                    onDateRangeChange={handleDateRangeChange}
                  />
                </div>
                <div className="flex flex-col gap-2.5">
                  <h3 className="text-[15px] font-bold leading-5 text-ink">Område</h3>
                  <LocationFilter
                    variant="plain"
                    selectedLocation={selectedLocation}
                    areaCounts={areaCounts}
                    onLocationChange={(location) => {
                      setSelectedLocation(location);
                      updateUrlParams({ location: location !== "Hela Varberg" ? location : null });
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2.5">
                  <h3 className="text-[15px] font-bold leading-5 text-ink">Kategori</h3>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={pillClass(selectedCategories.length === 0)} onClick={clearCategories}>
                      Alla
                    </button>
                    {CATEGORY_FILTERS.map((c) => (
                      <button key={c.id} type="button" className={pillClass(selectedCategories.includes(c.id))} onClick={() => toggleCategory(c.id)}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>

              {/* Listan, grupperad per dag */}
              <div className="flex min-w-0 flex-1 flex-col gap-[18px] px-4 pt-1.5 lg:gap-7 lg:px-0 lg:pt-0">
                {listGroups.length === 0 ? (
                  <p className="py-12 text-center text-ink-soft">Inga evenemang matchar filtret.</p>
                ) : (
                  listGroups.map((group, groupIndex) => (
                    <div key={group.key} className="flex flex-col gap-2 lg:gap-3">
                      <h3 className="text-[15px] font-bold leading-5 text-ink lg:text-lg lg:leading-6">
                        {group.label} <span className="font-medium text-ink-soft">{group.dateShort}</span>
                      </h3>
                      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-3">
                        {group.events.map((event, index) => (
                          <Fragment key={event.id}>
                            <EventListRow event={event} />
                            {groupIndex === 0 && index === Math.min(2, group.events.length - 1) && promoSlot && (
                              <div className="lg:col-span-2">{promoSlot}</div>
                            )}
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  ))
                )}
                {listEvents.length > visibleCount && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((n) => n + LIST_PAGE_SIZE)}
                    className="mt-1.5 flex min-h-12 items-center justify-center self-stretch rounded-xl bg-ink px-8 text-[15px] font-semibold text-white transition-colors hover:bg-navy lg:self-center"
                  >
                    Visa fler evenemang
                  </button>
                )}
              </div>
            </div>
          </section>
        </main>

        <InstagramPromoDialog
          open={promoPopupOpen}
          onOpenChange={handlePromoPopupOpenChange}
          onClick={handlePromoPopupClick}
        />

        <Footer />
      </div>
    </>
  );
};

export default Index;
