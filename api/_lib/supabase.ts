// Supabase REST-hämtning för de serverrenderade sidorna.
// Utökad från api/landing.ts med area, organizer-embed samt kategori-/områdesfilter.

export interface DbEvent {
  event_id: string;
  name: string;
  date_time: string; // naiv svensk lokaltid, ex "2026-07-14T10:30:00"
  venue_name: string | null;
  location: string | null;
  price: string | null;
  categories: string[] | null;
  description: string | null;
  image_url: string | null;
  featured: boolean;
  area: string | null;
  // organizers har ingen slug-kolumn – sluggen bor i organizer_pages (1:1)
  organizer: {
    name: string;
    organizer_pages: { slug: string; is_published: boolean } | null;
  } | null;
}

// Publik arrangörsslug (/arrangor/:slug) om arrangören har en publicerad sida
export function organizerSlug(e: DbEvent): string | null {
  const page = e.organizer?.organizer_pages;
  return page && page.is_published ? page.slug : null;
}

export interface FetchEventsOpts {
  from: string; // inkl (YYYY-MM-DD)
  to: string; // exkl (YYYY-MM-DD)
  limit?: number;
  category?: string; // exakt DB-värde, ex "Barn & Familj"
  area?: string; // exakt DB-värde, ex "Övriga kommunen"
}

const OVRIGA_KOMMUNEN = 'Övriga kommunen';

export async function fetchEvents(opts: FetchEventsOpts): Promise<DbEvent[] | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    return null;
  }
  const select =
    'event_id,name,date_time,venue_name,location,price,categories,description,image_url,featured,area,organizer:organizers(name,organizer_pages(slug,is_published))';
  let url =
    `${supabaseUrl}/rest/v1/events?status=eq.published` +
    `&date_time=gte.${opts.from}T00:00:00&date_time=lt.${opts.to}T00:00:00` +
    `&select=${select}&order=date_time.asc&limit=${opts.limit ?? 200}`;

  // Array-contains på TEXT[]-kolumnen categories. Värden med &, mellanslag och
  // åäö måste URL-encodas, ex 'Barn & Familj' -> cs.%7B%22Barn%20%26%20Familj%22%7D
  if (opts.category) {
    url += `&categories=cs.${encodeURIComponent(`{"${opts.category}"}`)}`;
  }

  // Områdesregeln speglar SPA:n (src/types/event.ts): "Övriga kommunen"
  // matchar även NULL, övriga områden matchar exakt.
  if (opts.area) {
    url +=
      opts.area === OVRIGA_KOMMUNEN
        ? `&or=${encodeURIComponent(`(area.is.null,area.eq."${OVRIGA_KOMMUNEN}")`)}`
        : `&area=eq.${encodeURIComponent(opts.area)}`;
  }

  const res = await fetch(url, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  if (!res.ok) {
    console.error(`Failed to fetch events: HTTP ${res.status}`);
    return null;
  }
  return res.json();
}
