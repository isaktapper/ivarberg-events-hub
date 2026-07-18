import { supabase } from '@/lib/supabase';
import { Event, EventDisplay, EventCategory, getAllCategories, CategoryScore } from '@/types/event';

// Skicka tips till event_tips tabellen via säker API
export async function submitEventTip(eventData: {
  event_name: string;
  date_time: string;
  event_location: string;
  venue_name?: string;
  description: string;
  categories: EventCategory[];
  category?: EventCategory;
  image_url?: string;
  website_url?: string;
  submitter_email?: string;
  submitter_name?: string;
}): Promise<{ success: boolean; tip_id?: number; error?: string }> {
  try {
    console.log('Submitting event tip via API:', eventData);

    // Client-side validering (för snabb feedback till användaren)
    const validationResult = validateEventSubmission({
      name: eventData.event_name,
      date_time: eventData.date_time,
      location: eventData.event_location,
      description: eventData.description,
      categories: eventData.categories,
      image_url: eventData.image_url,
      organizer_event_url: eventData.website_url
    });

    if (!validationResult.isValid) {
      return { success: false, error: validationResult.error };
    }

    // Skicka till vår säkra API endpoint
    const response = await fetch('/api/submit-event-tip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('API error:', result);
      return { success: false, error: result.error || 'Ett fel uppstod vid inlämning' };
    }

    console.log('Tip submitted successfully via API:', result);
    return { success: true, tip_id: result.tip_id };

  } catch (error) {
    console.error('Unexpected error submitting tip:', error);
    return { success: false, error: 'Ett oväntat fel uppstod' };
  }
}

// Säkerhetsvalidering för event-submission
function validateEventSubmission(eventData: {
  name: string;
  date_time: string;
  location: string;
  description: string;
  categories: EventCategory[];
  image_url?: string;
  organizer_event_url?: string;
}): { isValid: boolean; error?: string } {
  // Validera namn
  if (eventData.name.length < 3 || eventData.name.length > 200) {
    return { isValid: false, error: 'Namnet måste vara mellan 3 och 200 tecken' };
  }

  // Validera beskrivning
  if (eventData.description.length < 10 || eventData.description.length > 2000) {
    return { isValid: false, error: 'Beskrivningen måste vara mellan 10 och 2000 tecken' };
  }

  // Validera plats
  if (eventData.location.length < 3 || eventData.location.length > 200) {
    return { isValid: false, error: 'Platsen måste vara mellan 3 och 200 tecken' };
  }

  // Validera kategorier
  if (eventData.categories.length === 0) {
    return { isValid: false, error: 'Du måste välja minst en kategori' };
  }

  if (eventData.categories.length > 3) {
    return { isValid: false, error: 'Du kan bara välja max 3 kategorier' };
  }

  // Validera URL:er om de finns
  if (eventData.image_url) {
    try {
      new URL(eventData.image_url);
    } catch {
      return { isValid: false, error: 'Bild-URL:en är inte giltig' };
    }
  }

  if (eventData.organizer_event_url) {
    try {
      new URL(eventData.organizer_event_url);
    } catch {
      return { isValid: false, error: 'Hemsida-URL:en är inte giltig' };
    }
  }

  // Kontrollera för potentiellt skadligt innehåll
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:/i,
    /vbscript:/i
  ];

  const textToCheck = `${eventData.name} ${eventData.description} ${eventData.location}`;
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(textToCheck)) {
      return { isValid: false, error: 'Innehållet innehåller otillåten kod' };
    }
  }

  return { isValid: true };
}

// Helper function för sortering - behandlar 00:00 som 12:00 för sortering
function getSortableDate(date: Date): number {
  const sortDate = new Date(date);
  const hours = sortDate.getHours();
  const minutes = sortDate.getMinutes();
  
  // Om det är 00:00, behandla det som 12:00 för sorteringsändamål
  if (hours === 0 && minutes === 0) {
    sortDate.setHours(12, 0, 0, 0);
  }
  
  return sortDate.getTime();
}

// Transformera Supabase event till frontend format
export function transformEventForDisplay(event: Event): EventDisplay {
  const eventDate = new Date(event.date_time);
  
  // Kontrollera om händelsen börjar vid 00:00 (hela dagen)
  const hours = eventDate.getHours();
  const minutes = eventDate.getMinutes();
  const isAllDay = hours === 0 && minutes === 0;
  
  return {
    id: event.event_id,
    title: event.name,
    // Gamla systemet (bakåtkompatibilitet)
    category: event.category,
    // Nya systemet
    categories: event.categories,
    category_scores: event.category_scores,
    date: eventDate,
    // Kl 00:00 betyder i praktiken "tid saknas i källan" - vi påstår inget
    // (tidigare visades det som "Hela dagen", vilket oftast var fel).
    // Tom sträng = okänd tid; UI:t utelämnar då klockslaget helt.
    time: isAllDay ? '' : eventDate.toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    location: event.location,
    venue_name: event.venue_name,
    area: event.area,
    // Prissträngen är fritext i blandade format - visas rakt av, tolkas aldrig.
    // Gratis-status kommer ENBART från is_free (sätts i admin), aldrig från price.
    price: event.price || '',
    is_free: event.is_free ?? null,
    image: event.image_url || '/placeholder.svg',
    description: event.description || '',
    isFeatured: event.featured,
    organizer_event_url: event.organizer_event_url,
    event_website: event.event_website,
    organizer: event.organizer ? {
      name: event.organizer.name,
      website: event.organizer.website || undefined,
      email: event.organizer.email || undefined,
      phone: event.organizer.phone || undefined,
    } : undefined
  };
}

// Hämta alla publicerade events
export async function getPublishedEvents(): Promise<EventDisplay[]> {
  try {
    console.log('🔍 Fetching events from Supabase...');

    // Skapa dagens datum i svensk tid (Stockholm timezone) vid midnatt
    const today = new Date();
    const stockholmTime = new Date(today.toLocaleString('en-US', { timeZone: 'Europe/Stockholm' }));
    stockholmTime.setHours(0, 0, 0, 0);

    // Formatera som lokal datetime-sträng för Supabase (YYYY-MM-DD HH:MM:SS)
    const year = stockholmTime.getFullYear();
    const month = String(stockholmTime.getMonth() + 1).padStart(2, '0');
    const day = String(stockholmTime.getDate()).padStart(2, '0');
    const filterDate = `${year}-${month}-${day} 00:00:00`;

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:organizers(*)
      `)
      .eq('status', 'published')
      .gte('date_time', filterDate) // Endast events från idag och framåt (svensk tid)
      .order('featured', { ascending: false })
      .order('date_time', { ascending: true });

    console.log('📊 Supabase response:', { data, error });
    console.log('📅 Current date filter (Swedish time):', filterDate);

    if (error) {
      console.error('❌ Error fetching events:', error);
      return [];
    }

    console.log(`✅ Found ${data?.length || 0} current/future events`);
    const transformedEvents = (data || []).map(transformEventForDisplay);
    
    // Sortera events: featured först, sedan efter datum (00:00 behandlas som 12:00)
    transformedEvents.sort((a, b) => {
      // Featured events först
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      
      // Sedan sortera efter datum (00:00 behandlas som 12:00 för sortering)
      return getSortableDate(a.date) - getSortableDate(b.date);
    });
    
    console.log('🔄 Transformed and sorted events:', transformedEvents);

    return transformedEvents;
  } catch (error) {
    console.error('💥 Error in getPublishedEvents:', error);
    return [];
  }
}

// DEBUG: Hämta alla events utan datum-filter
export async function getAllEvents(): Promise<EventDisplay[]> {
  try {
    console.log('🔍 DEBUG: Fetching ALL events (with current date filter)...');

    // Skapa dagens datum i svensk tid (Stockholm timezone) vid midnatt
    const today = new Date();
    const stockholmTime = new Date(today.toLocaleString('en-US', { timeZone: 'Europe/Stockholm' }));
    stockholmTime.setHours(0, 0, 0, 0);

    // Formatera som lokal datetime-sträng för Supabase (YYYY-MM-DD HH:MM:SS)
    const year = stockholmTime.getFullYear();
    const month = String(stockholmTime.getMonth() + 1).padStart(2, '0');
    const day = String(stockholmTime.getDate()).padStart(2, '0');
    const filterDate = `${year}-${month}-${day} 00:00:00`;

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:organizers(*)
      `)
      .eq('status', 'published')
      .gte('date_time', filterDate) // Endast events från idag och framåt (svensk tid)
      .order('featured', { ascending: false })
      .order('date_time', { ascending: true });

    console.log('📊 DEBUG: All events response:', { data, error });
    console.log('📅 DEBUG: Date filter (Swedish time):', filterDate);

    if (error) {
      console.error('❌ DEBUG: Error fetching all events:', error);
      return [];
    }

    console.log(`✅ DEBUG: Found ${data?.length || 0} current/future events`);
    const transformedEvents = (data || []).map(transformEventForDisplay);
    
    // Sortera events: featured först, sedan efter datum (00:00 behandlas som 12:00)
    transformedEvents.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return getSortableDate(a.date) - getSortableDate(b.date);
    });
    
    return transformedEvents;
  } catch (error) {
    console.error('💥 DEBUG: Error in getAllEvents:', error);
    return [];
  }
}

// Hämta featured events
export async function getFeaturedEvents(): Promise<EventDisplay[]> {
  try {
    // Skapa dagens datum i svensk tid (Stockholm timezone) vid midnatt
    const today = new Date();
    const stockholmTime = new Date(today.toLocaleString('en-US', { timeZone: 'Europe/Stockholm' }));
    stockholmTime.setHours(0, 0, 0, 0);

    // Formatera som lokal datetime-sträng för Supabase (YYYY-MM-DD HH:MM:SS)
    const year = stockholmTime.getFullYear();
    const month = String(stockholmTime.getMonth() + 1).padStart(2, '0');
    const day = String(stockholmTime.getDate()).padStart(2, '0');
    const filterDate = `${year}-${month}-${day} 00:00:00`;

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:organizers(*)
      `)
      .eq('status', 'published')
      .eq('featured', true)
      .gte('date_time', filterDate) // Endast events från idag och framåt (svensk tid)
      .order('date_time', { ascending: true })
      .limit(5);

    if (error) {
      console.error('Error fetching featured events:', error);
      return [];
    }

    const transformedEvents = (data || []).map(transformEventForDisplay);
    
    // Sortera events efter datum (00:00 behandlas som 12:00)
    transformedEvents.sort((a, b) => {
      return getSortableDate(a.date) - getSortableDate(b.date);
    });
    
    return transformedEvents;
  } catch (error) {
    console.error('Error in getFeaturedEvents:', error);
    return [];
  }
}

// Hämta events för en specifik kategori
export async function getEventsByCategory(category: EventCategory): Promise<EventDisplay[]> {
  try {
    // Skapa dagens datum i svensk tid (Stockholm timezone) vid midnatt
    const today = new Date();
    const stockholmTime = new Date(today.toLocaleString('en-US', { timeZone: 'Europe/Stockholm' }));
    stockholmTime.setHours(0, 0, 0, 0);

    // Formatera som lokal datetime-sträng för Supabase (YYYY-MM-DD HH:MM:SS)
    const year = stockholmTime.getFullYear();
    const month = String(stockholmTime.getMonth() + 1).padStart(2, '0');
    const day = String(stockholmTime.getDate()).padStart(2, '0');
    const filterDate = `${year}-${month}-${day} 00:00:00`;

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:organizers(*)
      `)
      .eq('status', 'published')
      .eq('category', category)
      .gte('date_time', filterDate) // Endast events från idag och framåt (svensk tid)
      .order('featured', { ascending: false })
      .order('date_time', { ascending: true });

    if (error) {
      console.error('Error fetching events by category:', error);
      return [];
    }

    const transformedEvents = (data || []).map(transformEventForDisplay);
    
    // Sortera events: featured först, sedan efter datum (00:00 behandlas som 12:00)
    transformedEvents.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return getSortableDate(a.date) - getSortableDate(b.date);
    });
    
    return transformedEvents;
  } catch (error) {
    console.error('Error in getEventsByCategory:', error);
    return [];
  }
}

// Hämta events inom ett datumintervall
export async function getEventsByDateRange(startDate: Date, endDate: Date): Promise<EventDisplay[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:organizers(*)
      `)
      .eq('status', 'published')
      .gte('date_time', startDate.toISOString().slice(0, 19))
      .lte('date_time', endDate.toISOString().slice(0, 19))
      .order('featured', { ascending: false })
      .order('date_time', { ascending: true });

    if (error) {
      console.error('Error fetching events by date range:', error);
      return [];
    }

    const transformedEvents = (data || []).map(transformEventForDisplay);
    
    // Sortera events: featured först, sedan efter datum (00:00 behandlas som 12:00)
    transformedEvents.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return getSortableDate(a.date) - getSortableDate(b.date);
    });
    
    return transformedEvents;
  } catch (error) {
    console.error('Error in getEventsByDateRange:', error);
    return [];
  }
}

// Sök events (fulltext search)
export async function searchEvents(searchTerm: string): Promise<EventDisplay[]> {
  try {
    // Skapa dagens datum i svensk tid (Stockholm timezone) vid midnatt
    const today = new Date();
    const stockholmTime = new Date(today.toLocaleString('en-US', { timeZone: 'Europe/Stockholm' }));
    stockholmTime.setHours(0, 0, 0, 0);

    // Formatera som lokal datetime-sträng för Supabase (YYYY-MM-DD HH:MM:SS)
    const year = stockholmTime.getFullYear();
    const month = String(stockholmTime.getMonth() + 1).padStart(2, '0');
    const day = String(stockholmTime.getDate()).padStart(2, '0');
    const filterDate = `${year}-${month}-${day} 00:00:00`;

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:organizers(*)
      `)
      .eq('status', 'published')
      .gte('date_time', filterDate) // Endast events från idag och framåt (svensk tid)
      .textSearch('name', searchTerm, {
        type: 'websearch',
        config: 'swedish'
      })
      .order('date_time', { ascending: true });

    if (error) {
      console.error('Error searching events:', error);
      return [];
    }

    const transformedEvents = (data || []).map(transformEventForDisplay);
    
    // Sortera events efter datum (00:00 behandlas som 12:00)
    transformedEvents.sort((a, b) => {
      return getSortableDate(a.date) - getSortableDate(b.date);
    });
    
    return transformedEvents;
  } catch (error) {
    console.error('Error in searchEvents:', error);
    return [];
  }
}

// Hämta events för en specifik arrangör (by name - deprecated, använd getEventsByOrganizerId istället)
export async function getEventsByOrganizer(organizerName: string): Promise<EventDisplay[]> {
  try {
    // Skapa dagens datum i svensk tid (Stockholm timezone) vid midnatt
    const today = new Date();
    const stockholmTime = new Date(today.toLocaleString('en-US', { timeZone: 'Europe/Stockholm' }));
    stockholmTime.setHours(0, 0, 0, 0);

    // Formatera som lokal datetime-sträng för Supabase (YYYY-MM-DD HH:MM:SS)
    const year = stockholmTime.getFullYear();
    const month = String(stockholmTime.getMonth() + 1).padStart(2, '0');
    const day = String(stockholmTime.getDate()).padStart(2, '0');
    const filterDate = `${year}-${month}-${day} 00:00:00`;

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:organizers(*)
      `)
      .eq('status', 'published')
      .gte('date_time', filterDate) // Endast events från idag och framåt (svensk tid)
      .ilike('organizer.name', `%${organizerName}%`) // Sök i organizer.name fält
      .order('featured', { ascending: false })
      .order('date_time', { ascending: true });

    if (error) {
      console.error('Error fetching events by organizer:', error);
      return [];
    }

    const transformedEvents = (data || []).map(transformEventForDisplay);
    
    // Sortera events: featured först, sedan efter datum (00:00 behandlas som 12:00)
    transformedEvents.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return getSortableDate(a.date) - getSortableDate(b.date);
    });
    
    return transformedEvents;
  } catch (error) {
    console.error('Error in getEventsByOrganizer:', error);
    return [];
  }
}

// Hämta events för en specifik arrangör (by organizer_id)
export async function getEventsByOrganizerId(organizerId: number): Promise<EventDisplay[]> {
  try {
    console.log('🔍 Fetching events for organizer_id:', organizerId);

    // Skapa dagens datum i svensk tid (Stockholm timezone) vid midnatt
    const today = new Date();
    const stockholmTime = new Date(today.toLocaleString('en-US', { timeZone: 'Europe/Stockholm' }));
    stockholmTime.setHours(0, 0, 0, 0);

    // Formatera som lokal datetime-sträng för Supabase (YYYY-MM-DD HH:MM:SS)
    const year = stockholmTime.getFullYear();
    const month = String(stockholmTime.getMonth() + 1).padStart(2, '0');
    const day = String(stockholmTime.getDate()).padStart(2, '0');
    const filterDate = `${year}-${month}-${day} 00:00:00`;

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:organizers(*)
      `)
      .eq('status', 'published')
      .eq('organizer_id', organizerId) // Filtrera på organizer_id
      .gte('date_time', filterDate) // Endast events från idag och framåt (svensk tid)
      .order('date_time', { ascending: true }); // Sortera på datum (tidigast först)

    console.log('📊 Events by organizer_id response:', { data, error });

    if (error) {
      console.error('Error fetching events by organizer_id:', error);
      return [];
    }

    console.log(`✅ Found ${data?.length || 0} upcoming events for organizer_id ${organizerId}`);
    const transformedEvents = (data || []).map(transformEventForDisplay);
    
    // Sortera events efter datum (00:00 behandlas som 12:00)
    transformedEvents.sort((a, b) => {
      return getSortableDate(a.date) - getSortableDate(b.date);
    });
    
    return transformedEvents;
  } catch (error) {
    console.error('Error in getEventsByOrganizerId:', error);
    return [];
  }
}

// Normalisera titel för seriedetektering: "Sommarkväll på Societén 12/7" och
// "Sommarkväll på Societén 19/7" ska räknas som samma eventserie.
function normalizeSeriesTitle(title: string): string {
  const dateWords = [
    'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag', 'söndag',
    'januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti',
    'september', 'oktober', 'november', 'december', 'kl'
  ];
  let normalized = title.toLowerCase()
    .replace(/\d+/g, ' ')
    .replace(/[^a-zåäöéü\s]/g, ' ');
  for (const word of dateWords) {
    normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'g'), ' ');
  }
  return normalized.replace(/\s+/g, ' ').trim();
}

// Samma eventserie = samma normaliserade titel + samma arrangör.
// Saknar båda arrangör krävs samma plats (annars matchar t.ex. två
// orelaterade "Julmarknad" i olika byar).
function isSameSeries(a: EventDisplay, b: EventDisplay): boolean {
  const keyA = normalizeSeriesTitle(a.title);
  if (!keyA || keyA !== normalizeSeriesTitle(b.title)) return false;
  const orgA = a.organizer?.name;
  const orgB = b.organizer?.name;
  if (orgA && orgB) return orgA === orgB;
  return (a.venue_name || a.location) === (b.venue_name || b.location);
}

export interface SimilarEventsResult {
  sameSeries: EventDisplay[];   // Samma event på andra datum ("Fler datum")
  similar: EventDisplay[];      // Poängsatt relaterade event
  similarIsFallback: boolean;   // true = inga relevanta träffar, listan är utfyllnad
}

// Hämta liknande events: en query för alla kommande event (45 dagar),
// sedan poängsättning i klienten på kategoriöverlapp, datumnärhet,
// område och gratis-status. Eventserier (samma event, annat datum)
// separeras ut till sameSeries i stället för att förorena listan.
export async function getSimilarEvents(currentEvent: EventDisplay): Promise<SimilarEventsResult> {
  const emptyResult: SimilarEventsResult = { sameSeries: [], similar: [], similarIsFallback: false };
  try {
    // Kandidatfönster: idag (svensk tid) och 45 dagar framåt
    const today = new Date();
    const stockholmTime = new Date(today.toLocaleString('en-US', { timeZone: 'Europe/Stockholm' }));
    stockholmTime.setHours(0, 0, 0, 0);
    const windowEnd = new Date(stockholmTime);
    windowEnd.setDate(windowEnd.getDate() + 45);
    windowEnd.setHours(23, 59, 59, 999);

    const formatDateForQuery = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:organizers(*)
      `)
      .eq('status', 'published')
      .neq('event_id', currentEvent.id)
      .gte('date_time', formatDateForQuery(stockholmTime))
      .lte('date_time', formatDateForQuery(windowEnd))
      .order('date_time', { ascending: true })
      .limit(400);

    if (error) {
      console.error('Error fetching similar event candidates:', error);
      return emptyResult;
    }

    const candidates = (data || []).map(transformEventForDisplay);
    const currentCategories = getAllCategories(currentEvent);
    const currentMain = currentCategories[0];
    const currentTime = currentEvent.date.getTime();

    const sameSeries: EventDisplay[] = [];
    const scored: { event: EventDisplay; score: number }[] = [];

    for (const candidate of candidates) {
      if (isSameSeries(currentEvent, candidate)) {
        sameSeries.push(candidate);
        continue;
      }

      const candidateCategories = getAllCategories(candidate);
      let score = 0;

      // Kategoriöverlapp: huvudkategori mot huvudkategori väger tyngst
      const mainMatch = currentMain && currentMain !== 'Okategoriserad' && candidateCategories[0] === currentMain;
      if (mainMatch) score += 3;
      const sharedCount = candidateCategories.filter(
        c => c !== 'Okategoriserad' && currentCategories.includes(c)
      ).length;
      score += Math.max(0, sharedCount - (mainMatch ? 1 : 0)) * 1.5;

      // Datumnärhet till det aktuella eventet, avtar linjärt till 0 vid 14 dagar
      const diffDays = Math.abs(candidate.date.getTime() - currentTime) / 86400000;
      score += 2 * Math.max(0, 1 - diffDays / 14);

      // Samma kända område ("Övriga kommunen" är geografiskt spritt och räknas inte)
      if (currentEvent.area && candidate.area === currentEvent.area && currentEvent.area !== 'Övriga kommunen') {
        score += 1;
      }

      // Samma gratis-status (endast när den är känd för båda)
      if (currentEvent.is_free != null && candidate.is_free === currentEvent.is_free) {
        score += 0.5;
      }

      scored.push({ event: candidate, score });
    }

    // Relevanta träffar, bästa först; featured och datum som tiebreakers
    const RELEVANCE_THRESHOLD = 2.5;
    const strong = scored
      .filter(s => s.score >= RELEVANCE_THRESHOLD)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.event.isFeatured !== b.event.isFeatured) return a.event.isFeatured ? -1 : 1;
        return getSortableDate(a.event.date) - getSortableDate(b.event.date);
      });

    // Max 2 event per arrangör så en aktiv arrangör inte fyller hela karusellen,
    // och varje eventserie visas bara en gång (bästa/närmaste datumet)
    const perOrganizer = new Map<string, number>();
    const similar: EventDisplay[] = [];
    for (const { event } of strong) {
      const organizerKey = event.organizer?.name || event.id;
      const count = perOrganizer.get(organizerKey) || 0;
      if (count >= 2) continue;
      if (similar.some(picked => isSameSeries(picked, event))) continue;
      perOrganizer.set(organizerKey, count + 1);
      similar.push(event);
      if (similar.length >= 6) break;
    }

    const similarIsFallback = similar.length === 0;

    // Fallback: fyll upp med närmast kommande event så sektionen aldrig är tom
    if (similar.length < 3) {
      const usedIds = new Set([...similar, ...sameSeries].map(e => e.id));
      for (const candidate of candidates) {
        if (usedIds.has(candidate.id)) continue;
        if (similar.some(picked => isSameSeries(picked, candidate))) continue;
        similar.push(candidate);
        usedIds.add(candidate.id);
        if (similar.length >= 6) break;
      }
    }

    // Hela serien returneras (max ~45 st i fönstret) — UI:t visar 6 och expanderar resten
    sameSeries.sort((a, b) => getSortableDate(a.date) - getSortableDate(b.date));

    return { sameSeries, similar, similarIsFallback };
  } catch (error) {
    console.error('Error in getSimilarEvents:', error);
    return emptyResult;
  }
}

// Prenumerera på nyhetsbrev
export async function subscribeToNewsletter(email: string, name: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validera e-post
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Ogiltig e-postadress' };
    }

    // Validera namn (obligatoriskt)
    if (!name || name.trim().length < 2 || name.trim().length > 100) {
      return { success: false, error: 'Namnet måste vara mellan 2 och 100 tecken' };
    }

    const subscriptionData = {
      email: email.trim().toLowerCase(),
      name: name.trim(),
    };

    const { error } = await supabase
      .from('newsletter_subscriptions')
      .insert([subscriptionData]);

    if (error) {
      // Om e-posten redan finns (unique constraint)
      if (error.code === '23505') {
        return { success: false, error: 'Denna e-postadress är redan registrerad' };
      }
      console.error('Error subscribing to newsletter:', error);
      return { success: false, error: `Fel vid registrering: ${error.message}` };
    }

    console.log('Newsletter subscription successful');
    return { success: true };

  } catch (error) {
    console.error('Unexpected error subscribing to newsletter:', error);
    return { success: false, error: 'Ett oväntat fel uppstod' };
  }
}
