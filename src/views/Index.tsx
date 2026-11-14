"use client";

import { Fragment, useState, useMemo, useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import { useHydrated, useSearchParams } from "@/lib/router";
import { Helmet } from "@/lib/helmet";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { EventRow } from "@/components/home/EventRow";
import { EventListRow } from "@/components/home/EventListRow";
import { DayStrip } from "@/components/home/DayStrip";
import { ArrowRightIcon } from "@/components/home/icons";
import { addDays, dayHeading, startOfDay, ymd, type HomeRow } from "@/lib/homeRows";
import { DateFilter } from "@/components/DateFilter";
import { ALL_LOCATIONS, LocationFilter } from "@/components/LocationFilter";
import { Footer } from "@/components/Footer";
import { LocalBusinessSchema } from "@/components/LocalBusinessSchema";
import { FAQSchema } from "@/components/FAQSchema";
import { InstagramPromoCard } from "@/components/InstagramPromoCard";
import { NewsletterCard } from "@/components/NewsletterCard";
import { useInstagramPromo } from "@/hooks/useInstagramPromo";
import { getSortableDate, isEventStillRelevant } from "@/services/eventService";
import { EventCategory, EventDisplay, hasCategory, eventMatchesArea } from "@/types/event";
import { useSite } from "@/config/SiteProvider";
import { VARBERG_SLUG } from "@/config/site";
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
  const site = useSite();
  const city = site.cityName;
  // Områdesfiltret visas bara för städer som har områden
  const showAreaFilter = site.features.areaFilter && site.areas.length > 0;
  const isKnownArea = (value: string | null): value is string => showAreaFilter && !!value && site.areas.includes(value);
  const [searchParams, setSearchParams] = useSearchParams();
  // Sidan är cachad och serverrenderas utan query-sträng; filtren i URL:en
  // finns först efter hydreringen (se src/lib/router.tsx)
  const hydrated = useHydrated();
  const [events, setEvents] = useState<EventDisplay[]>(initialEvents);
  const [loading, setLoading] = useState(false);
  // Filtren initieras från URL:en när komponenten monteras efter en
  // navigering i appen. Vid en vanlig sidladdning är URL:en tom under
  // hydreringen och filtren läses in av effekterna nedan.
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
    return isKnownArea(locationParam) ? locationParam : ALL_LOCATIONS;
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

  // Instagram-promo (PostHog-experimentet "instagram-promo"). Popupen är
  // borttagen: både inline- och popup-gruppen ser rutan i listan.
  const promo = useInstagramPromo();
  const inlineShownRef = useRef(false); // max en shown-event per sidladdning

  // Handle URL parameters - restore filters from URL on page load
  useEffect(() => {
    if (!hydrated) return;
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
    if (isKnownArea(locationParam)) {
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
    // Körs en gång, när URL:en finns tillgänglig efter hydreringen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

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
    if (!hydrated) return;
    if (searchParams.get('search') || urlToCategories(searchParams.get('cat')).length > 0) {
      setTimeout(() => scrollToResults(), 150);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Events hämtas på servern. Testevents (påhittade Varbergsevent) fylls bara
  // i under lokal utveckling av ivarberg.nu. En ny stad utan event, eller en
  // sajt vars databas är nere, ska visa tomt och aldrig påhittade event.
  useEffect(() => {
    if (initialEvents.length === 0 && process.env.NODE_ENV === "development" && site.slug === VARBERG_SLUG) {
      addTestEventsToState(setEvents);
    }
  }, [initialEvents, site.slug]);

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
    if (selectedLocation === ALL_LOCATIONS) return preLocationEvents;
    return preLocationEvents.filter((event) => eventMatchesArea(event, selectedLocation));
  }, [preLocationEvents, selectedLocation]);

  // Antal events per område, med övriga filter applicerade (visas i områdesfiltret)
  const areaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const area of site.areas) {
      counts[area] = preLocationEvents.filter((event) => eventMatchesArea(event, area)).length;
    }
    return counts;
  }, [preLocationEvents, site.areas]);

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
    selectedLocation !== ALL_LOCATIONS;

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
      return `${selectedCategories[0]} Evenemang i ${city} | ${site.name}`;
    }
    if (selectedDate) {
      return `Evenemang i ${city} ${selectedDate.toLocaleDateString('sv-SE')} | ${site.name}`;
    }
    if (dateRange) {
      return `Evenemang i ${city} - Kommande händelser | ${site.name}`;
    }
    return `Evenemang i ${city} - Din kompletta eventkalender | ${site.name}`;
  };

  const getPageDescription = () => {
    if (selectedCategories.length === 1) {
      return `Upptäck alla ${selectedCategories[0]} evenemang i ${city}. Hitta konserter, teater, sport och aktiviteter. Uppdateras dagligen med nya evenemang.`;
    }
    if (selectedDate) {
      return `Se alla evenemang i ${city} ${selectedDate.toLocaleDateString('sv-SE')}. Fullständig översikt över vad som händer i ${city} idag och framåt.`;
    }
    return `Din kompletta guide till ${site.cityGenitive} evenemang. Upptäck konserter, teater, sport, restauranger och aktiviteter för hela familjen. Uppdateras dagligen!`;
  };

  const getH1Text = () => {
    if (theme === HALLOWEEN_THEME) {
      return `Halloween i ${city}`;
    }
    if (selectedCategories.length === 1) {
      return `${selectedCategories[0]} Evenemang i ${city}`;
    }
    if (selectedDate) {
      return `Evenemang i ${city} ${selectedDate.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }
    return `Evenemang i ${city} - Upptäck vad som händer`;
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

  // En vald dag visas i sin helhet; annars 20 i taget med "Visa fler"
  const singleDay = selectedDate ? true : !!dateRange && ymd(dateRange.start) === ymd(dateRange.end);
  const shownCount = singleDay ? Number.MAX_SAFE_INTEGER : visibleCount;

  const listGroups = useMemo(() => {
    const now = new Date();
    const groups: { key: string; label: string; dateShort: string; events: EventDisplay[] }[] = [];
    for (const event of listEvents.slice(0, shownCount)) {
      const key = ymd(event.date);
      let group = groups[groups.length - 1];
      if (!group || group.key !== key) {
        group = { key, ...dayHeading(event.date, now), events: [] };
        groups.push(group);
      }
      group.events.push(event);
    }
    return groups;
  }, [listEvents, shownCount]);

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
  // Dagväljaren: antal evenemang per dag med alla filter utom datum
  const dayCounts = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    const counts: Record<string, number> = {};
    let total = 0;
    for (const event of events) {
      if (theme === HALLOWEEN_THEME && !isHalloweenEvent(event)) continue;
      if (
        searchLower &&
        !(
          event.title.toLowerCase().includes(searchLower) ||
          event.venue_name?.toLowerCase().includes(searchLower) ||
          event.location.toLowerCase().includes(searchLower) ||
          event.organizer?.name.toLowerCase().includes(searchLower)
        )
      )
        continue;
      if (selectedCategories.length > 0 && !selectedCategories.some((c) => hasCategory(event, c))) continue;
      if (selectedLocation !== ALL_LOCATIONS && !eventMatchesArea(event, selectedLocation)) continue;
      const key = ymd(event.date);
      counts[key] = (counts[key] ?? 0) + 1;
      total++;
    }
    return { counts, total };
  }, [events, theme, searchTerm, selectedCategories, selectedLocation]);

  const selectedDays = dateRange
    ? { start: ymd(dateRange.start), end: ymd(dateRange.end) }
    : selectedDate
      ? { start: ymd(selectedDate), end: ymd(selectedDate) }
      : undefined;

  const handleDaySelect = (day: Date) => {
    const key = ymd(day);
    if (selectedDays && selectedDays.start === key && selectedDays.end === key) {
      clearDates();
      return;
    }
    posthog?.capture("home_day_selected", { day: key, count: dayCounts.counts[key] ?? 0 });
    applyDateRange(day, day);
  };

  // "Nästa dag" i slutet av en vald dag: närmaste dag efter urvalet som har evenemang
  const nextDay = useMemo(() => {
    if (!selectedDays) return null;
    const [y, m, d] = selectedDays.end.split("-").map(Number);
    const end = new Date(y, m - 1, d);
    for (let i = 1; i <= 90; i++) {
      const day = addDays(end, i);
      const count = dayCounts.counts[ymd(day)];
      if (count) return { day, count, adjacent: i === 1 };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDays?.end, dayCounts]);

  const handleHeroDateRange = (start: Date, end: Date) => {
    applyDateRange(start, end);
    scrollToList();
  };

  const handleHeroFamily = () => {
    const categories: EventCategory[] = ["Barn & Familj"];
    setSelectedCategories(categories);
    updateUrlParams({ cat: categoriesToUrl(categories) });
    scrollToList();
  };

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

  const listTitle = theme === HALLOWEEN_THEME ? `Halloween i ${city}` : "Alla evenemang";

  const promoSlot =
    promo.showInline || promo.showPopup ? (
      <InstagramPromoCard
        onShown={() => {
          if (!inlineShownRef.current) {
            inlineShownRef.current = true;
            promo.trackShown("home_feed");
          }
        }}
        onClick={() => promo.trackClicked("home_feed")}
      />
    ) : null;

  return (
    <>
      <Helmet>
        <title>{getPageTitle()}</title>
        <meta name="description" content={getPageDescription()} />
        <meta name="keywords" content={`evenemang ${city}, ${city} event, att göra ${city}, vad göra ${city}, ${city} kalender, events ${city}, ${city} aktiviteter`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={getPageTitle()} />
        <meta property="og:description" content={getPageDescription()} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={site.url} />
        {site.theme.ogImage && <meta property="og:image" content={site.theme.ogImage} />}
        <meta property="og:locale" content="sv_SE" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={getPageTitle()} />
        <meta name="twitter:description" content={getPageDescription()} />
        {site.theme.ogImage && <meta name="twitter:image" content={site.theme.ogImage} />}
        
        <link rel="canonical" href={`${site.url}/`} />
      </Helmet>
      
      {/* Structured Data */}
      <LocalBusinessSchema />
      <FAQSchema />

      <div className="min-h-screen bg-white">
        <Header />
        <Hero
          onThemeSelect={handleThemeSelect}
          onDateRange={handleHeroDateRange}
          onFamily={handleHeroFamily}
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
            <div className="flex items-baseline justify-between gap-4 px-4 lg:relative lg:z-[31] lg:px-0" ref={resultsRef}>
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
                    setSelectedLocation(ALL_LOCATIONS);
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
              <p className="px-4 text-sm text-ink-soft lg:relative lg:z-[31] lg:px-0">
                Sökresultat för <span className="font-semibold text-ink">”{searchTerm.trim()}”</span>
              </p>
            )}

            {/* På dator följer dagraden med under den svävande menyn när man skrollar i listan.
                Det vita fältet ovanför (before) täcker glipan bakom den svävande menyn. */}
            <div className="lg:sticky lg:top-[68px] lg:z-30 lg:-my-3 lg:bg-white lg:py-3 lg:before:absolute lg:before:inset-x-0 lg:before:bottom-full lg:before:h-[68px] lg:before:bg-white">
            <DayStrip
              today={today}
              counts={dayCounts.counts}
              total={dayCounts.total}
              selected={selectedDays}
              onSelectDay={handleDaySelect}
              onSelectAll={clearDates}
              renderDatePicker={(trigger) => (
                <DateFilter
                  variant="plain"
                  trigger={trigger}
                  selectedDate={selectedDate}
                  dateRange={dateRange}
                  onDateChange={handleDateChange}
                  onDateRangeChange={handleDateRangeChange}
                />
              )}
            />
            </div>

            <div className="flex flex-col gap-3.5 lg:flex-row lg:items-start lg:gap-10">
              {/* Filter: knappar + kategorirad på mobil, panel till vänster på dator */}
              {showAreaFilter && <div className="flex gap-2 px-4 lg:hidden" ref={filtersRef}>
                <div className="flex-1">
                  <LocationFilter
                    variant="plain"
                    selectedLocation={selectedLocation}
                    areaCounts={areaCounts}
                    onLocationChange={(location) => {
                      setSelectedLocation(location);
                      updateUrlParams({ location: location !== ALL_LOCATIONS ? location : null });
                    }}
                  />
                </div>
              </div>}
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

              <aside className="hidden w-[260px] shrink-0 flex-col gap-7 lg:sticky lg:top-[174px] lg:flex lg:max-h-[calc(100dvh-190px)] lg:overflow-y-auto">
                {showAreaFilter && <div className="flex flex-col gap-2.5">
                  <h3 className="text-[15px] font-bold leading-5 text-ink">Område</h3>
                  <LocationFilter
                    variant="plain"
                    selectedLocation={selectedLocation}
                    areaCounts={areaCounts}
                    onLocationChange={(location) => {
                      setSelectedLocation(location);
                      updateUrlParams({ location: location !== ALL_LOCATIONS ? location : null });
                    }}
                  />
                </div>}
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
                    <Fragment key={group.key}>
                    <div className="flex flex-col gap-2 lg:gap-3">
                      <h3 className="text-[15px] font-bold leading-5 text-ink lg:text-lg lg:leading-6">
                        {group.label} <span className="font-medium text-ink-soft">{group.dateShort}</span>
                      </h3>
                      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-3">
                        {group.events.map((event, index) => (
                          <Fragment key={event.id}>
                            <EventListRow event={event} />
                          </Fragment>
                        ))}
                      </div>
                    </div>
                    {/* Torsdagsbrevet efter första dagen, Instagram efter den andra */}
                    {groupIndex === 0 && <NewsletterCard source="home_list" />}
                    {groupIndex === 1 && promoSlot}
                    </Fragment>
                  ))
                )}
                {nextDay && listEvents.length <= shownCount && (
                  <button
                    type="button"
                    onClick={() => {
                      applyDateRange(nextDay.day, nextDay.day);
                      scrollToList();
                    }}
                    className="mt-1.5 flex min-h-12 items-center justify-between gap-3 rounded-xl bg-[#F4F5F7] px-4 text-left transition-colors hover:bg-[#ECEEF2]"
                  >
                    <span className="text-[15px] font-semibold text-ink">
                      {nextDay.adjacent ? "Nästa dag" : "Nästa"}: {dayHeading(nextDay.day, new Date()).label.toLowerCase()}{" "}
                      {nextDay.day.getDate()} {["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"][nextDay.day.getMonth()]}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-sea">
                      {nextDay.count}
                      <ArrowRightIcon />
                    </span>
                  </button>
                )}
                {listEvents.length > shownCount && (
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

        <Footer />
      </div>
    </>
  );
};

export default Index;
