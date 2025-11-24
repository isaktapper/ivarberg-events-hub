import { supabase } from '@/lib/supabase';
import { Event } from '@/types/event';

/**
 * Fetch hero featured events from database
 * Returns main featured event and up to 5 secondary featured events
 */
export async function fetchHeroFeaturedEvents(): Promise<{
  main: Event | null;
  secondary: Event[];
}> {
  try {
    // Fetch main featured event
    const { data: mainFeatured, error: mainError } = await supabase
      .from('hero_featured_events')
      .select(`
        *,
        event:events!inner(
          *,
          organizer:organizers(*)
        )
      `)
      .eq('position', 'main')
      .eq('event.status', 'published')
      .single();

    if (mainError && mainError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (not an error, just no main featured)
      console.error('Error fetching main featured event:', mainError);
    }

    // Fetch secondary featured events
    const { data: secondaryFeatured, error: secondaryError } = await supabase
      .from('hero_featured_events')
      .select(`
        *,
        event:events!inner(
          *,
          organizer:organizers(*)
        )
      `)
      .eq('position', 'secondary')
      .eq('event.status', 'published')
      .order('priority', { ascending: true })
      .limit(5);

    if (secondaryError) {
      console.error('Error fetching secondary featured events:', secondaryError);
    }

    // Extract event objects from featured records
    const mainEvent = (mainFeatured as any)?.event || null;
    const secondaryEvents = (secondaryFeatured as any[])?.map(item => item.event) || [];

    return {
      main: mainEvent,
      secondary: secondaryEvents
    };
  } catch (error) {
    console.error('Error in fetchHeroFeaturedEvents:', error);
    return {
      main: null,
      secondary: []
    };
  }
}

/**
 * Format event date to Swedish locale
 */
export function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

