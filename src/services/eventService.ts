import { supabase } from '@/lib/supabase';
import { Event, EventDisplay, EventCategory } from '@/types/event';

// Transformera Supabase event till frontend format
export function transformEventForDisplay(event: Event): EventDisplay {
  const eventDate = new Date(event.date_time);
  
  return {
    id: event.event_id,
    title: event.name,
    category: event.category,
    date: eventDate,
    time: eventDate.toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    location: event.location,
    venue_name: event.venue_name,
    price: event.price || 'Gratis',
    image: event.image_url || '/placeholder.svg',
    description: event.description || '',
    isFeatured: event.featured,
    organizer_event_url: event.organizer_event_url,
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
    console.log('🔄 Transformed events:', transformedEvents);

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
    return (data || []).map(transformEventForDisplay);
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

    return (data || []).map(transformEventForDisplay);
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

    return (data || []).map(transformEventForDisplay);
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

    return (data || []).map(transformEventForDisplay);
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

    return (data || []).map(transformEventForDisplay);
  } catch (error) {
    console.error('Error in searchEvents:', error);
    return [];
  }
}

// Hämta events för en specifik arrangör
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

    return (data || []).map(transformEventForDisplay);
  } catch (error) {
    console.error('Error in getEventsByOrganizer:', error);
    return [];
  }
}

// Hämta liknande events (samma kategori, +/- 1 dag)
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

    console.log(`🔍 Searching for similar events:`, {
      currentEvent: currentEvent.title,
      currentDate: eventDate.toISOString(),
      category: currentEvent.category,
      today: stockholmTime.toISOString(),
      searchRange: {
        originalStart: startDate.toISOString(),
        actualStart: actualStartDate.toISOString(),
        end: endDate.toISOString()
      }
    });

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:organizers(*)
      `)
      .eq('status', 'published')
      .eq('category', currentEvent.category)
      .neq('event_id', currentEvent.id) // Exkludera nuvarande event
      .gte('date_time', formatDateForQuery(actualStartDate))
      .lte('date_time', formatDateForQuery(endDate))
      .order('featured', { ascending: false })
      .order('date_time', { ascending: true })
      .limit(6); // Begränsa till 6 events för karusellen

    console.log(`📊 Similar events found:`, data?.length || 0, data);

    if (error) {
      console.error('Error fetching similar events:', error);
      return [];
    }

    return (data || []).map(transformEventForDisplay);
  } catch (error) {
    console.error('Error in getSimilarEvents:', error);
    return [];
  }
}
