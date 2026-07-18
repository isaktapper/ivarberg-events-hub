import { useParams, Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Calendar, MapPin, ArrowLeft, ExternalLink, Mail, Phone, ChevronRight, CalendarPlus, Share2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BreadcrumbSchema } from "@/components/Breadcrumbs";
import { SimilarEventsCarousel } from "@/components/SimilarEventsCarousel";
import { EventDescription } from "@/components/EventDescription";
import { supabase } from "@/lib/supabase";
import { EventDisplay, getAllCategories, getMainCategory, getCategoryChipColor } from "@/types/event";
import { transformEventForDisplay, getSimilarEvents } from "@/services/eventService";
import { formatLocation } from "@/lib/locationUtils";
import { usePostHog } from "posthog-js/react";

// Fas 3-flagga: sticky botten-CTA på mobil. Mät utklick via cta_position i PostHog
// och stäng av här om baren inte motiverar ytan den tar.
const STICKY_CTA_ENABLED = true;

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const posthog = usePostHog();
  const [event, setEvent] = useState<EventDisplay | null>(null);
  const [similarEvents, setSimilarEvents] = useState<EventDisplay[]>([]);
  const [sameSeriesEvents, setSameSeriesEvents] = useState<EventDisplay[]>([]);
  const [similarIsFallback, setSimilarIsFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const [ctaOutOfView, setCtaOutOfView] = useState(false);
  const [showAllDates, setShowAllDates] = useState(false);

  // Hämta event från Supabase
  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            organizer:organizers(*)
          `)
          .eq('event_id', id)
          .eq('status', 'published')
          .single();

        if (error) {
          console.error('Error fetching event:', error);
          setEvent(null);
        } else if (data) {
          const eventData = transformEventForDisplay(data);
          setEvent(eventData);

          // Hämta liknande evenemang och andra datum i samma serie
          setLoadingSimilar(true);
          try {
            const { sameSeries, similar, similarIsFallback } = await getSimilarEvents(eventData);
            setSimilarEvents(similar);
            setSameSeriesEvents(sameSeries);
            setSimilarIsFallback(similarIsFallback);
          } catch (error) {
            console.error('Error fetching similar events:', error);
            setSimilarEvents([]);
            setSameSeriesEvents([]);
            setSimilarIsFallback(false);
          } finally {
            setLoadingSimilar(false);
          }
        }
      } catch (error) {
        console.error('Error in fetchEvent:', error);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  // Scroll to top when component mounts and when navigating between events
  // (e.g. via similar events carousel, which stays on the same route)
  useEffect(() => {
    window.scrollTo(0, 0);
    setShowAllDates(false);
  }, [id]);

  // Track event view when event is loaded
  useEffect(() => {
    if (event) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      const isPastEvent = eventDate < today;

      posthog?.capture('event_viewed', {
        event_id: event.id,
        event_title: event.title,
        category: getAllCategories(event)[0],
        all_categories: getAllCategories(event),
        venue_name: event.venue_name,
        is_featured: event.isFeatured,
        is_past: isPastEvent,
        organizer_name: event.organizer?.name,
      });
    }
  }, [event, posthog]);

  // Sticky botten-CTA visas när inline-CTA:n scrollats ur bild
  useEffect(() => {
    const el = ctaRef.current;
    if (!el || !STICKY_CTA_ENABLED) return;

    const observer = new IntersectionObserver(
      ([entry]) => setCtaOutOfView(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [event]);

  if (loading) {
    return (
      <div className="min-h-screen bg-texture">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sea"></div>
            <p className="mt-4 text-ink">Laddar evenemang...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-texture">
        <Helmet>
          <title>Evenemang hittades inte | ivarberg.nu</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-ink">Evenemang hittades inte</h1>
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tillbaka till startsidan
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const locationInfo = formatLocation(event.venue_name, event.location);
  const mainCategory = getMainCategory(event);
  const organizerUrl = event.event_website || event.organizer_event_url;
  const hasImage = event.image && event.image !== '/placeholder.svg';

  // Kontrollera om eventet har passerat
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(event.date);
  eventDate.setHours(0, 0, 0, 0);
  const isPast = eventDate < today;

  // "Sön 19 juli" — år bara när det inte är innevarande år
  const sameYear = event.date.getFullYear() === new Date().getFullYear();
  const rawDateLabel = event.date.toLocaleDateString('sv-SE', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' as const })
  });
  const dateLabel = rawDateLabel.charAt(0).toUpperCase() + rawDateLabel.slice(1);

  const handleOrganizerClick = (position: 'inline' | 'sticky') => {
    posthog?.capture('organizer_cta_clicked', {
      event_id: event.id,
      event_title: event.title,
      organizer_name: event.organizer?.name,
      organizer_url: organizerUrl,
      url_type: event.event_website ? 'event_website' : 'organizer_event_url',
      cta_position: position,
    });
  };

  // Spåra klick på relaterade event (karusell och "Fler datum")
  const handleRelatedEventClick = (clicked: EventDisplay, linkType: 'similar' | 'same_series') => {
    posthog?.capture('similar_event_clicked', {
      from_event_id: event.id,
      from_event_title: event.title,
      to_event_id: clicked.id,
      to_event_title: clicked.title,
      link_type: linkType,
      is_fallback: linkType === 'similar' ? similarIsFallback : false,
    });
  };

  // Funktion för att dela eventet
  const handleShare = async () => {
    const shareData = {
      title: event.title,
      text: `Kolla in: ${event.title} - ${event.date.toLocaleDateString('sv-SE')}${event.time ? ` ${event.time}` : ''}\n\n${window.location.href}`,
      url: window.location.href
    };

    try {
      // Kontrollera om Web Share API finns
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: Kopiera länk till urklipp
        await navigator.clipboard.writeText(window.location.href);
        alert('Länken har kopierats till urklipp!');
      }
    } catch (err) {
      // Användaren avbröt delningen eller något gick fel
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Error sharing:', err);
        // Fallback: Kopiera länk
        try {
          await navigator.clipboard.writeText(window.location.href);
          alert('Länken har kopierats till urklipp!');
        } catch (clipboardErr) {
          console.error('Error copying to clipboard:', clipboardErr);
        }
      }
    }
  };

  // Öppna vägbeskrivning i kartapp
  const openDirections = () => {
    const address = encodeURIComponent(locationInfo.address);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const mapsUrl = isIOS
      ? `maps://maps.apple.com/?q=${address}`
      : `https://www.google.com/maps/search/?api=1&query=${address}`;
    window.open(mapsUrl, '_blank');
  };

  // Funktion för att skapa .ics-fil
  const generateICS = () => {
    // Formatera datum och tid för iCalendar-format
    const formatICSDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    };

    // Skapa start- och sluttid (antag 2 timmar om ingen sluttid finns)
    const startDate = new Date(event.date);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // +2 timmar

    // Skapa ICS-innehåll
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ivarberg.nu//Event Calendar//SV',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
      `LOCATION:${locationInfo.hasVenueName ? `${locationInfo.venueName}, ${locationInfo.address}` : locationInfo.address}`,
      `UID:${event.id}@ivarberg.nu`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    // Skapa blob och ladda ner
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SEO data
  const cleanDescription = event.description.replace(/[#*_\[\]`]/g, '').replace(/\n+/g, ' ');
  const seoDescription = `${event.title} i Varberg - ${event.date.toLocaleDateString('sv-SE')}${event.time ? ` kl ${event.time}` : ''}. ${cleanDescription.substring(0, 120)}...`;
  const seoKeywords = `${event.title}, evenemang Varberg, ${getAllCategories(event).join(', ')}, event Varberg, Varberg evenemang`;
  const eventUrl = `https://ivarberg.nu/event/${id}`;

  // SEO-friendly alt text for event image
  const imageAlt = `${event.title} - ${mainCategory} evenemang i Varberg den ${event.date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })} på ${locationInfo.hasVenueName ? locationInfo.venueName : locationInfo.address}`;

  // Event Schema.org structured data
  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.title,
    "startDate": event.date.toISOString(),
    "endDate": new Date(event.date.getTime() + 2 * 60 * 60 * 1000).toISOString(), // +2 hours
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": event.venue_name || event.location,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": event.location,
        "addressLocality": "Varberg",
        "postalCode": "432 44",
        "addressCountry": "SE"
      }
    },
    "image": [event.image],
    "description": cleanDescription.substring(0, 200),
    "organizer": event.organizer ? {
      "@type": "Organization",
      "name": event.organizer.name,
      "url": event.organizer.website || "https://ivarberg.nu"
    } : {
      "@type": "Organization",
      "name": "ivarberg.nu",
      "url": "https://ivarberg.nu"
    }
  };

  return (
    <>
      <Helmet>
        <title>{event.title} - Evenemang i Varberg | ivarberg.nu</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={seoKeywords} />

        {/* Open Graph */}
        <meta property="og:title" content={`${event.title} - ivarberg.nu`} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="event" />
        <meta property="og:url" content={eventUrl} />
        <meta property="og:image" content={event.image} />
        <meta property="og:locale" content="sv_SE" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${event.title} - ivarberg.nu`} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={event.image} />

        <link rel="canonical" href={eventUrl} />

        {/* Event Schema */}
        <script type="application/ld+json">
          {JSON.stringify(eventSchema)}
        </script>
      </Helmet>

      {/* Brödsmulor: synligt UI borttaget (Layout A), SEO-schemat behålls */}
      <BreadcrumbSchema items={[
        { label: 'Evenemang', href: '/' },
        { label: mainCategory, href: `/?category=${encodeURIComponent(mainCategory)}` },
        { label: event.title, href: `/event/${id}` }
      ]} />

      <div className="min-h-screen bg-texture">
        <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Nav-rad: en rad, riktig länk inåt + synlig delaknapp */}
          <div className="mb-4 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-sea hover:text-sea-dark transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Alla evenemang
            </Link>
            <Button onClick={handleShare} variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-1.5" />
              Dela
            </Button>
          </div>

          {/* Hero-bild 16:9, kant-till-kant på mobil, med designad fallback för bildlösa event */}
          <div className="relative mb-5 -mx-4 sm:mx-0">
            {hasImage ? (
              <img
                src={event.image}
                alt={imageAlt}
                className="w-full aspect-video object-cover sm:rounded-xl"
              />
            ) : (
              <div className="w-full aspect-video sm:rounded-xl bg-navy flex flex-col items-center justify-center gap-2 overflow-hidden relative">
                <Calendar className="h-10 w-10 text-seaglass" aria-hidden="true" />
                <span className="text-sand text-lg font-semibold">{mainCategory}</span>
                <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M0,12 C50,22 100,2 150,8 C200,14 250,24 300,16 C350,8 375,4 400,12 L400,24 L0,24 Z" fill="hsl(var(--sea-mist) / 0.25)" />
                </svg>
              </div>
            )}
            {isPast && (
              <span className="absolute top-3 left-3 px-3 py-1.5 bg-destructive text-white rounded-full text-sm font-bold shadow-lg">
                PASSERAT
              </span>
            )}
          </div>

          <div className="space-y-5">
            {/* Overline + titel */}
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-ink-soft">
                {mainCategory}{locationInfo.hasVenueName ? ` · ${locationInfo.venueName}` : ''}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold leading-tight text-ink mt-1">
                {event.title}
              </h1>
              {event.isFeatured && (
                <p className="text-sm font-medium mt-1.5 text-poppy">
                  Marknadsfört event
                </p>
              )}
            </div>

            {/* Metablock: datum, plats, fler datum — med etiketterade knappar */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-ink font-medium">
                  <Calendar className="h-5 w-5 shrink-0 text-sea" />
                  <span>{dateLabel}{event.time ? ` kl ${event.time}` : ''}</span>
                </div>
                <Button onClick={generateICS} variant="secondary" size="sm" className="shrink-0 font-semibold">
                  <CalendarPlus className="h-4 w-4 mr-1" />
                  Kalender
                </Button>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <MapPin className="h-5 w-5 shrink-0 text-sea" />
                  {/* Adressen visas bara när platsnamn saknas — "Hitta hit" och
                      kalenderfilen bär den fullständiga adressen */}
                  <p className="text-ink font-medium">
                    {locationInfo.hasVenueName ? locationInfo.venueName : locationInfo.address}
                  </p>
                </div>
                <Button onClick={openDirections} variant="secondary" size="sm" className="shrink-0 font-semibold">
                  <MapPin className="h-4 w-4 mr-1" />
                  Hitta hit
                </Button>
              </div>

              {sameSeriesEvents.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
                  <span className="text-[13px] font-semibold text-ink-soft">Fler datum:</span>
                  {(showAllDates ? sameSeriesEvents : sameSeriesEvents.slice(0, 6)).map((seriesEvent) => (
                    <Link
                      key={seriesEvent.id}
                      to={`/event/${seriesEvent.id}`}
                      onClick={() => handleRelatedEventClick(seriesEvent, 'same_series')}
                      className="rounded-full px-3 py-1 text-[13px] font-semibold bg-sea-lightest text-sea-dark border border-sea/30 hover:bg-sea-light transition-colors"
                    >
                      {seriesEvent.date.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </Link>
                  ))}
                  {sameSeriesEvents.length > 6 && (
                    <button
                      onClick={() => {
                        setShowAllDates(!showAllDates);
                        if (!showAllDates) {
                          posthog?.capture('series_dates_expanded', {
                            event_id: event.id,
                            event_title: event.title,
                            total_dates: sameSeriesEvents.length,
                          });
                        }
                      }}
                      className="rounded-full px-3 py-1 text-[13px] font-bold text-sea hover:text-sea-dark underline-offset-2 hover:underline transition-colors"
                    >
                      {showAllDates ? 'Visa färre' : `+${sameSeriesEvents.length - 6} till`}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Primär CTA — synlig i första viewporten */}
            {organizerUrl && (
              <div ref={ctaRef}>
                <a
                  href={organizerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleOrganizerClick('inline')}
                >
                  <Button className="w-full h-[52px] rounded-xl bg-ink text-white text-base font-bold hover:bg-navy shadow-md">
                    Mer info hos arrangören
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </a>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div>
                <h2 className="text-[19px] font-bold mb-3 text-ink">Om evenemanget</h2>
                <EventDescription description={event.description} />
              </div>
            )}

            {/* Organizer info */}
            {event.organizer && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-[17px] font-bold mb-3 text-ink">Arrangör</h3>
                <div className="space-y-3">
                  <p className="font-medium text-ink">{event.organizer.name}</p>

                  <div className="flex flex-col gap-2">
                    {event.organizer.website && (
                      <a
                        href={event.organizer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sea hover:text-sea-dark transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Besök webbplats
                      </a>
                    )}

                    {event.organizer.email && (
                      <a
                        href={`mailto:${event.organizer.email}`}
                        className="inline-flex items-center gap-2 text-sea hover:text-sea-dark transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                        {event.organizer.email}
                      </a>
                    )}

                    {event.organizer.phone && (
                      <a
                        href={`tel:${event.organizer.phone}`}
                        className="inline-flex items-center gap-2 text-sea hover:text-sea-dark transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                        {event.organizer.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Similar Events */}
            {!loadingSimilar && similarEvents.length > 0 && (
              <div className="mt-8">
                <SimilarEventsCarousel
                  events={similarEvents}
                  title={similarIsFallback ? 'Mer att göra i Varberg' : 'Liknande evenemang'}
                  onEventClick={(clicked) => handleRelatedEventClick(clicked, 'similar')}
                />
              </div>
            )}

            {/* Loading state for similar events */}
            {loadingSimilar && (
              <div className="mt-8 bg-card rounded-xl p-6 border border-border">
                <h2 className="text-[19px] font-bold mb-4 text-ink">Liknande evenemang</h2>
                <div className="flex items-center justify-center py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-sea"></div>
                  <span className="ml-3 text-ink-soft">Laddar liknande evenemang...</span>
                </div>
              </div>
            )}

            {/* Kategorichips: "vad mer finns?" hör hemma längst ner, inte före titeln */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-sm font-medium text-ink-soft">Mer inom:</span>
              {getAllCategories(event).map((category) => {
                const chip = getCategoryChipColor(category);
                return (
                  <Link
                    key={category}
                    to={`/?category=${encodeURIComponent(category)}`}
                    className="rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-opacity hover:opacity-80"
                    style={{ backgroundColor: chip.bg, color: chip.text }}
                  >
                    {category}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Sticky botten-CTA (mobil): visas när inline-CTA:n scrollats förbi */}
      {STICKY_CTA_ENABLED && organizerUrl && ctaOutOfView && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 md:hidden border-t border-border bg-white/95 backdrop-blur-sm px-4 pt-3"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          <a
            href={organizerUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleOrganizerClick('sticky')}
          >
            <Button className="w-full h-12 rounded-xl bg-ink text-white text-base font-bold hover:bg-navy">
              Mer info hos arrangören
              <ChevronRight className="h-5 w-5" />
            </Button>
          </a>
        </div>
      )}
      <Footer />
      </div>
    </>
  );
};

export default EventDetail;
