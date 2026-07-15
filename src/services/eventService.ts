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

// Hämta liknande events (alla kategorier som eventet har, +/- 1 dag)
export async function getSimilarEvents(currentEvent: EventDisplay): Promise<EventDisplay[]> {
  try {
    // Beräkna datumintervall (+/- 1 dag) - hela dagar
    const eventDate = new Date(currentEvent.date);

    // Skapa dagens datum i svensk tid (Stockholm timezone) vid midnatt
    const today = new Date();
    const stockholmTime = new Date(today.toLocaleString('en-US', { timeZone: 'Europe/Stockholm' }));
    stockholmTime.setHours(0, 0, 0, 0);

    // Startdatum: 1 dag före, från början av dagen (00:00:00)
    // Men aldrig tidigare än idag
    const startDate = new Date(eventDate);
    startDate.setDate(eventDate.getDate() - 1);
    startDate.setHours(0, 0, 0, 0);

    // Använd dagens datum som minimum startdatum
    const actualStartDate = startDate < stockholmTime ? stockholmTime : startDate;

    // Slutdatum: 1 dag efter, till slutet av dagen (23:59:59)
    const endDate = new Date(eventDate);
    endDate.setDate(eventDate.getDate() + 1);
    endDate.setHours(23, 59, 59, 999);

    // Formatera datum för Supabase query
    const formatDateForQuery = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    // Hämta alla kategorier för det aktuella eventet
    const eventCategories = getAllCategories(currentEvent);

    console.log(`🔍 Searching for similar events:`, {
      currentEvent: currentEvent.title,
      currentDate: eventDate.toISOString(),
      categories: eventCategories,
      today: stockholmTime.toISOString(),
      searchRange: {
        originalStart: startDate.toISOString(),
        actualStart: actualStartDate.toISOString(),
        end: endDate.toISOString()
      }
    });

    // Hämta events för varje kategori och kombinera resultaten
    const allSimilarEvents: Event[] = [];
    
    for (const category of eventCategories) {
      const { data: categoryData, error: categoryError } = await supabase
        .from('events')
        .select(`
          *,
          organizer:organizers(*)
        `)
        .eq('status', 'published')
        .eq('category', category) // Huvudkategori måste matcha
        .neq('event_id', currentEvent.id) // Exkludera nuvarande event
        .gte('date_time', formatDateForQuery(actualStartDate))
        .lte('date_time', formatDateForQuery(endDate))
        .order('featured', { ascending: false })
        .order('date_time', { ascending: true })
        .limit(6);

      if (categoryError) {
        console.error(`Error fetching events for category ${category}:`, categoryError);
        continue;
      }

      // Lägg till events som inte redan finns i listan
      if (categoryData) {
        for (const event of categoryData) {
          if (!allSimilarEvents.find(e => e.event_id === event.event_id)) {
            allSimilarEvents.push(event);
          }
        }
      }
    }

    // Transformera och sortera events
    const transformedEvents = allSimilarEvents.map(transformEventForDisplay);
    
    // Sortera: featured först, sedan efter datum (00:00 behandlas som 12:00)
    const sortedEvents = transformedEvents
      .sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return getSortableDate(a.date) - getSortableDate(b.date);
      })
      .slice(0, 6);

    console.log(`📊 Similar events found:`, sortedEvents.length, sortedEvents);

    return sortedEvents;
  } catch (error) {
    console.error('Error in getSimilarEvents:', error);
    return [];
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
