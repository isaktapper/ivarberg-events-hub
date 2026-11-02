import type { VercelRequest, VercelResponse } from '@vercel/node';

// Alla kommande publicerade event för SPA:n (startsidan, sökningen, "liknande
// event" på eventsidan och arrangörssidorna) - JSON via Vercels CDN-cache.
//
// Varför: SPA:n hämtade tidigare hela eventtabellen (select *, inkl. långa
// beskrivningar och hela arrangörsposten) direkt från Supabase vid varje besök
// och varje eventsida. Det drev Supabase-egress över gratisplanens 5 GB.
// Här hämtas bara fälten som listorna visar, och svaret cachas i CDN:en så att
// Supabase bara anropas några gånger i timmen oavsett trafik.
//
// Eventsidans egen hämtning (ett event med beskrivning) går fortfarande direkt
// mot Supabase och påverkas inte.

import { stockholmToday, addDays } from './_lib/dates.js';

// Exakt de fält som transformEventForDisplay + listkomponenterna använder
const LIST_SELECT =
  'event_id,name,categories,date_time,location,venue_name,area,price,is_free,image_url,featured,organizer_id,organizer:organizers(name)';

// Speglar src/lib/seasonal.ts: halloweensäsong 24 okt till söndagen efter Alla helgons dag
function halloweenSeasonEnd(year: number): string {
  let d = `${year}-10-31`;
  const isSaturday = (iso: string) => new Date(`${iso}T12:00:00Z`).getUTCDay() === 6;
  while (!isSaturday(d)) d = addDays(d, 1);
  return addDays(d, 1);
}

async function supabaseGet(path: string): Promise<unknown[] | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    return null;
  }
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  if (!res.ok) {
    console.error(`Failed to fetch events: HTTP ${res.status}`);
    return null;
  }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const today = stockholmToday();
    const events = (await supabaseGet(
      `events?status=eq.published&date_time=gte.${today}T00:00:00` +
        `&select=${LIST_SELECT}&order=date_time.asc&limit=2000`
    )) as Array<Record<string, unknown>> | null;

    if (events === null) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(502).json({ error: 'Kunde inte hämta event' });
    }

    // Halloweentemat matchar även på beskrivningen (isHalloweenEvent). Under
    // säsongen skickas därför beskrivningen med för event fram till säsongens slut.
    const year = Number(today.slice(0, 4));
    const seasonEnd = halloweenSeasonEnd(year);
    const inSeason = (today >= `${year}-10-24` && today <= seasonEnd) || req.query.halloween === '1';
    if (inSeason) {
      const descriptions = (await supabaseGet(
        `events?status=eq.published&date_time=gte.${today}T00:00:00` +
          `&date_time=lt.${addDays(seasonEnd, 1)}T00:00:00&select=event_id,description&limit=2000`
      )) as Array<{ event_id: string; description: string | null }> | null;
      const byId = new Map((descriptions ?? []).map((d) => [d.event_id, d.description]));
      for (const e of events) {
        const description = byId.get(e.event_id as string);
        if (description) e.description = description;
      }
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // CDN: färskt i 5 min, därefter serveras cachen direkt medan en ny hämtas i bakgrunden
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600');
    return res.status(200).json({ events, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error in /api/events:', error);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({ error: 'Kunde inte hämta event' });
  }
}
