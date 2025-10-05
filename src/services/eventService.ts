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
    
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:organizers(*)
      `)
      .eq('status', 'published')
      .gte('date_time', new Date().toISOString().slice(0, 19)) // Endast framtida events (utan timezone)
      .order('featured', { ascending: false })
      .order('date_time', { ascending: true });

    console.log('📊 Supabase response:', { data, error });
    console.log('📅 Current date filter:', new Date().toISOString().slice(0, 19));

    if (error) {
      console.error('❌ Error fetching events:', error);
      return [];
    }

    console.log(`✅ Found ${data?.length || 0} events`);
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
    console.log('🔍 DEBUG: Fetching ALL events (no date filter)...');
    
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:organizers(*)
      `)
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('date_time', { ascending: true });

    console.log('📊 DEBUG: All events response:', { data, error });

    if (error) {
      console.error('❌ DEBUG: Error fetching all events:', error);
      return [];
    }

    console.log(`✅ DEBUG: Found ${data?.length || 0} total events`);
    return (data || []).map(transformEventForDisplay);
  } catch (error) {
    console.error('💥 DEBUG: Error in getAllEvents:', error);
    return [];
  }
}

// Hämta featured events
export async function getFeaturedEvents(): Promise<EventDisplay[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:organizers(*)
      `)
      .eq('status', 'published')
      .eq('featured', true)
      .gte('date_time', new Date().toISOString().slice(0, 19))
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
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:organizers(*)
      `)
      .eq('status', 'published')
      .eq('category', category)
      .gte('date_time', new Date().toISOString().slice(0, 19))
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
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:organizers(*)
      `)
      .eq('status', 'published')
      .gte('date_time', new Date().toISOString().slice(0, 19))
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
