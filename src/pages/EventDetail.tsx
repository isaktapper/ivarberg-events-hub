import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Calendar, MapPin, ArrowLeft, ExternalLink, Mail, Phone, ChevronRight, CalendarPlus, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SimilarEventsCarousel } from "@/components/SimilarEventsCarousel";
import { EventDescription } from "@/components/EventDescription";
import { supabase } from "@/lib/supabase";
import { EventDisplay } from "@/types/event";
import { transformEventForDisplay, getSimilarEvents } from "@/services/eventService";
import { formatLocation } from "@/lib/locationUtils";

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDisplay | null>(null);
  const [similarEvents, setSimilarEvents] = useState<EventDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

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
          
          // Hämta liknande evenemang
          setLoadingSimilar(true);
          try {
            const similar = await getSimilarEvents(eventData);
            setSimilarEvents(similar);
          } catch (error) {
            console.error('Error fetching similar events:', error);
            setSimilarEvents([]);
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

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#4A90E2' }}></div>
            <p className="mt-4" style={{ color: '#08075C' }}>Laddar evenemang...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4" style={{ color: '#08075C' }}>Evenemang hittades inte</h1>
            <Link to="/">
              <Button 
                variant="outline"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#08075C',
                  borderColor: '#08075C'
                }}
              >
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

  // Kontrollera om eventet har passerat
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(event.date);
  eventDate.setHours(0, 0, 0, 0);
  const isPast = eventDate < today;

  // Funktion för att dela eventet
  const handleShare = async () => {
    const shareData = {
      title: event.title,
      text: `${event.title} - ${event.date.toLocaleDateString('sv-SE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })} ${event.time}`,
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Event content */}
        <div className="max-w-4xl mx-auto">
          {/* Back button and Share button */}
          <div className="mb-6 flex items-center justify-between">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tillbaka
              </Button>
            </Link>
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="px-3 py-2"
              style={{
                backgroundColor: '#FFFFFF',
                color: '#08075C',
                borderColor: '#08075C'
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              <span>Dela</span>
            </Button>
          </div>
          {/* Event image */}
          <div className="relative mb-8">
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-64 md:h-96 object-cover rounded-xl"
            />
            {/* Category badge overlay */}
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-secondary-foreground">
                {event.category}
              </span>
            </div>
          </div>

          {/* Category label under image */}
          <div className="mb-6">
            <Link 
              to={`/?category=${encodeURIComponent(event.category)}`}
              className="inline-block"
            >
              <span 
                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-md cursor-pointer"
                style={{
                  backgroundColor: '#4A90E2',
                  color: '#FFFFFF',
                  border: '1px solid #4A90E2'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#3A7BC8';
                  e.currentTarget.style.borderColor = '#3A7BC8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#4A90E2';
                  e.currentTarget.style.borderColor = '#4A90E2';
                }}
              >
                {event.category}
              </span>
            </Link>
          </div>

          {/* Past event badge */}
          {isPast && (
            <div className="mb-4">
              <span className="inline-block px-4 py-2 bg-red-600 text-white rounded-full text-sm font-bold shadow-lg">
                PASSERAT
              </span>
            </div>
          )}

          {/* Event info */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold" style={{ color: '#08075C' }}>
                {event.title}
              </h1>
              {event.isFeatured && (
                <p className="text-base italic mt-2" style={{ color: '#4A90E2' }}>
                  Marknadsfört event
                </p>
              )}
            </div>

            {/* Date and location */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2" style={{ color: '#08075C', opacity: 0.8 }}>
                  <Calendar className="h-5 w-5" style={{ color: '#4A90E2' }} />
                  <span className="text-lg">
                    {event.date.toLocaleDateString('sv-SE', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} - {event.time}
                  </span>
                </div>
                <Button
                  onClick={generateICS}
                  size="sm"
                  variant="outline"
                  className="flex-shrink-0 px-3 py-2"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#08075C',
                    borderColor: '#08075C'
                  }}
                >
                  <CalendarPlus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Lägg till</span>
                </Button>
              </div>
              
              <div className="space-y-2">
                {locationInfo.hasVenueName ? (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2" style={{ color: '#08075C', opacity: 0.8 }}>
                        <MapPin className="h-5 w-5" style={{ color: '#4A90E2' }} />
                        <span className="text-lg">{locationInfo.venueName}</span>
                      </div>
                      <Button
                        onClick={() => {
                          const address = encodeURIComponent(locationInfo.address);
                          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                          const mapsUrl = isIOS
                            ? `maps://maps.apple.com/?q=${address}`
                            : `https://www.google.com/maps/search/?api=1&query=${address}`;
                          window.open(mapsUrl, '_blank');
                        }}
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0 px-3 py-2"
                        style={{
                          backgroundColor: '#FFFFFF',
                          color: '#08075C',
                          borderColor: '#08075C'
                        }}
                      >
                        <MapPin className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Vägbeskrivning</span>
                      </Button>
                    </div>
                    <div className="ml-7" style={{ color: '#08075C', opacity: 0.6 }}>
                      <span className="text-base">{locationInfo.address}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2" style={{ color: '#08075C', opacity: 0.8 }}>
                      <MapPin className="h-5 w-5" style={{ color: '#4A90E2' }} />
                      <span className="text-lg">{locationInfo.address}</span>
                    </div>
                    <Button
                      onClick={() => {
                        const address = encodeURIComponent(locationInfo.address);
                        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                        const mapsUrl = isIOS
                          ? `maps://maps.apple.com/?q=${address}`
                          : `https://www.google.com/maps/search/?api=1&query=${address}`;
                        window.open(mapsUrl, '_blank');
                      }}
                      size="sm"
                      variant="outline"
                      className="flex-shrink-0 px-3 py-2"
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: '#08075C',
                        borderColor: '#08075C'
                      }}
                    >
                      <MapPin className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Vägbeskrivning</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div>
                <h2 className="text-xl font-semibold mb-4" style={{ color: '#08075C' }}>Om evenemanget</h2>
                <EventDescription description={event.description} />
              </div>
            )}

            {/* Organizer CTA Button */}
            {event.organizer && event.organizer_event_url && (
              <div className="mt-6">
                <a
                  href={event.organizer_event_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-8 py-4 text-lg font-semibold"
                    style={{
                      backgroundColor: '#4A90E2',
                      color: '#FFFFFF',
                      border: 'none'
                    }}
                  >
                    Gå till arrangör
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                </a>
              </div>
            )}

            {/* Organizer info */}
            {event.organizer && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Arrangör</h3>
                <div className="space-y-3">
                  <p className="font-medium">{event.organizer.name}</p>
                  
                  <div className="flex flex-col gap-2">
                    {event.organizer.website && (
                      <a
                        href={event.organizer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:text-primary-hover transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Besök webbplats
                      </a>
                    )}
                    
                    {event.organizer.email && (
                      <a
                        href={`mailto:${event.organizer.email}`}
                        className="inline-flex items-center gap-2 text-primary hover:text-primary-hover transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                        {event.organizer.email}
                      </a>
                    )}
                    
                    {event.organizer.phone && (
                      <a
                        href={`tel:${event.organizer.phone}`}
                        className="inline-flex items-center gap-2 text-primary hover:text-primary-hover transition-colors"
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
                <SimilarEventsCarousel events={similarEvents} />
              </div>
            )}

            {/* Loading state for similar events */}
            {loadingSimilar && (
              <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-2xl font-bold mb-6" style={{ color: '#08075C' }}>
                  Liknande evenemang
                </h3>
                <div className="flex items-center justify-center py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#4A90E2' }}></div>
                  <span className="ml-3 text-gray-600">Laddar liknande evenemang...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventDetail;
