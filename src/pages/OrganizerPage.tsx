import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Calendar, MapPin, ArrowLeft, ExternalLink, Mail, Phone, Globe, Facebook, Instagram, Twitter, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EventList } from "@/components/EventList";
import { EventDisplay } from "@/types/event";
import { supabase } from "@/lib/supabase";
import { getEventsByOrganizerId } from "@/services/eventService";
import { ImageGallery } from "@/components/ImageGallery";

interface OrganizerPage {
  id: number;
  slug: string;
  name: string;
  title: string;
  description: string;
  content: string;
  hero_image_url: string;
  gallery_images: string[];
  organizer_id: number | null;
  contact_info: {
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
  };
  social_links: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  is_published: boolean;
}

const OrganizerPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [organizer, setOrganizer] = useState<OrganizerPage | null>(null);
  const [events, setEvents] = useState<EventDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);

  // Hämta arrangörsinformation
  useEffect(() => {
    const fetchOrganizer = async () => {
      if (!slug) return;
      
      setLoading(true);
      try {
        console.log('Fetching organizer with slug:', slug);
        const { data, error } = await supabase
          .from('organizer_pages')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .single();

        console.log('Supabase response:', { data, error });

        if (error) {
          console.error('Error fetching organizer:', error);
          setOrganizer(null);
        } else if (data) {
          console.log('Organizer found:', data);
          setOrganizer(data);
          
          // Hämta evenemang för denna arrangör (endast om organizer_id finns)
          if (data.organizer_id) {
            setEventsLoading(true);
            try {
              const organizerEvents = await getEventsByOrganizerId(data.organizer_id);
              console.log('Organizer events:', organizerEvents);
              setEvents(organizerEvents);
            } catch (error) {
              console.error('Error fetching organizer events:', error);
              setEvents([]);
            } finally {
              setEventsLoading(false);
            }
          } else {
            console.log('No organizer_id found, skipping event fetch');
            setEvents([]);
          }
        }
      } catch (error) {
        console.error('Error in fetchOrganizer:', error);
        setOrganizer(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizer();
  }, [slug]);

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
            <p className="mt-4" style={{ color: '#08075C' }}>Laddar arrangör...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4" style={{ color: '#08075C' }}>Arrangör hittades inte</h1>
            <p className="mb-4" style={{ color: '#08075C', opacity: 0.7 }}>Slug: {slug}</p>
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Back button */}
          <div className="mb-6">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tillbaka till evenemang
              </Button>
            </Link>
          </div>

          {/* Hero section */}
          <div className="relative mb-8">
            <div className="relative h-64 md:h-96 overflow-hidden rounded-xl">
              <img
                src={organizer.hero_image_url || '/placeholder.svg'}
                alt={organizer.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{organizer.name}</h1>
                <p className="text-lg opacity-90">{organizer.title}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2">
              {/* Description */}
              <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#08075C' }}>Om {organizer.name}</h2>
                <div className="prose max-w-none" style={{ color: '#08075C', opacity: 0.8 }}>
                  <p className="text-lg mb-4">{organizer.description}</p>
                  {organizer.content && (
                    <div 
                      className="text-base leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: organizer.content.replace(/\n/g, '<br>') }}
                    />
                  )}
                </div>
              </div>

              {/* Gallery */}
              {organizer.gallery_images && organizer.gallery_images.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
                  <h3 className="text-xl font-bold mb-4" style={{ color: '#08075C' }}>Bilder från {organizer.name}</h3>
                  <ImageGallery images={organizer.gallery_images} />
                </div>
              )}

              {/* Events section - only show if there are events */}
              {!eventsLoading && events.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-xl font-bold mb-4" style={{ color: '#08075C' }}>
                    Kommande evenemang hos {organizer.name}
                  </h3>
                  <div className="relative">
                    <EventList events={showAllEvents ? events : events.slice(0, 3)} />
                    
                    {/* Gradient fade and "Show more" button (only if more than 3 events and not expanded) */}
                    {!showAllEvents && events.length > 3 && (
                      <>
                        <div 
                          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
                          style={{
                            background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1))',
                            marginTop: '-8rem'
                          }}
                        />
                        <div className="flex justify-center pt-4 relative z-10">
                          <Button
                            onClick={() => setShowAllEvents(true)}
                            variant="outline"
                            className="gap-2"
                            style={{
                              backgroundColor: '#FFFFFF',
                              color: '#08075C',
                              borderColor: '#08075C'
                            }}
                          >
                            Visa fler evenemang ({events.length - 3} till)
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                    
                    {/* "Show less" button when expanded */}
                    {showAllEvents && events.length > 3 && (
                      <div className="flex justify-center pt-6">
                        <Button
                          onClick={() => setShowAllEvents(false)}
                          variant="outline"
                          className="gap-2"
                          style={{
                            backgroundColor: '#FFFFFF',
                            color: '#08075C',
                            borderColor: '#08075C'
                          }}
                        >
                          Visa färre evenemang
                          <ChevronDown className="h-4 w-4 rotate-180" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact info */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4" style={{ color: '#08075C' }}>Kontakt</h3>
                <div className="space-y-3">
                  {organizer.contact_info.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4" style={{ color: '#4A90E2' }} />
                      <a 
                        href={`mailto:${organizer.contact_info.email}`}
                        className="text-sm hover:underline"
                        style={{ color: '#08075C', opacity: 0.8 }}
                      >
                        {organizer.contact_info.email}
                      </a>
                    </div>
                  )}
                  {organizer.contact_info.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4" style={{ color: '#4A90E2' }} />
                      <a 
                        href={`tel:${organizer.contact_info.phone}`}
                        className="text-sm hover:underline"
                        style={{ color: '#08075C', opacity: 0.8 }}
                      >
                        {organizer.contact_info.phone}
                      </a>
                    </div>
                  )}
                  {organizer.contact_info.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4" style={{ color: '#4A90E2' }} />
                      <a 
                        href={organizer.contact_info.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline flex items-center gap-1"
                        style={{ color: '#08075C', opacity: 0.8 }}
                      >
                        Besök webbplats
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {organizer.contact_info.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4" style={{ color: '#4A90E2' }} />
                      <span className="text-sm" style={{ color: '#08075C', opacity: 0.8 }}>
                        {organizer.contact_info.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Social links */}
              {(organizer.social_links.facebook || organizer.social_links.instagram || organizer.social_links.twitter) && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold mb-4" style={{ color: '#08075C' }}>Följ oss</h3>
                  <div className="flex gap-3">
                    {organizer.social_links.facebook && (
                      <a
                        href={organizer.social_links.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Facebook className="h-5 w-5" style={{ color: '#4A90E2' }} />
                      </a>
                    )}
                    {organizer.social_links.instagram && (
                      <a
                        href={organizer.social_links.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Instagram className="h-5 w-5" style={{ color: '#4A90E2' }} />
                      </a>
                    )}
                    {organizer.social_links.twitter && (
                      <a
                        href={organizer.social_links.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Twitter className="h-5 w-5" style={{ color: '#4A90E2' }} />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4" style={{ color: '#08075C' }}>Vill du arrangera evenemang?</h3>
                <p className="text-sm mb-4" style={{ color: '#08075C', opacity: 0.7 }}>
                  Tipsa oss om ditt evenemang så lägger vi upp det på ivarberg.nu!
                </p>
                <Link to="/tips">
                  <Button 
                    className="w-full"
                    style={{
                      backgroundColor: '#4A90E2',
                      color: '#FFFFFF',
                      border: 'none'
                    }}
                  >
                    Tipsa oss om evenemang
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrganizerPage;