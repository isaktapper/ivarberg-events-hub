/**
 * Datahämtning för serverrenderingen. Samma frågor som klienten gjorde
 * tidigare (eventService), men körs nu på servern så att innehållet finns i
 * HTML:en från start.
 */

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase";
import { halloweenSeasonEnd, isHalloweenSeason } from "@/lib/seasonal";
import {
  LIST_EVENT_SELECT,
  buildOrganizerEvents,
  buildPublishedEvents,
  buildSimilarEvents,
  stockholmTodayStart,
  transformEventForDisplay,
  type SimilarEventsResult,
} from "@/services/eventService";
import type { Event, EventDisplay } from "@/types/event";

// Säkerställ svensk tid även om instrumentation inte hunnit köras (se next.config.ts)
process.env.TZ = "Europe/Stockholm";

// Listorna använder bara början av beskrivningen (halloween-matchning) –
// resten skickas inte med i HTML:en, som annars blir över 1 MB.
const LIST_DESCRIPTION_CHARS = 1000;

export function toListEvent(event: EventDisplay): EventDisplay {
  return {
    ...event,
    description: event.description.slice(0, LIST_DESCRIPTION_CHARS),
    category_scores: undefined,
  };
}

function formatLocalDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function loadUpcomingEventRows(): Promise<Event[]> {
  const today = stockholmTodayStart();
  const { data, error } = await supabase
    .from("events")
    .select(LIST_EVENT_SELECT)
    .eq("status", "published")
    .gte("date_time", formatLocalDateTime(today))
    .order("date_time", { ascending: true })
    .limit(2000);
  // Kastar så att ett fel aldrig cachas (unstable_cache sparar bara lyckade svar)
  if (error) throw new Error(`Kunde inte hämta event: ${error.message}`);
  const rows = (data ?? []) as unknown as Event[];

  // Halloweentemat matchar även på beskrivningen (isHalloweenEvent). Under
  // säsongen hämtas den därför för eventen fram till säsongens slut.
  if (isHalloweenSeason()) {
    const seasonEnd = halloweenSeasonEnd(today.getFullYear());
    const { data: descriptions } = await supabase
      .from("events")
      .select("event_id,description")
      .eq("status", "published")
      .gte("date_time", formatLocalDateTime(today))
      .lte("date_time", formatLocalDateTime(seasonEnd));
    const byId = new Map((descriptions ?? []).map((d) => [d.event_id, d.description]));
    for (const row of rows) row.description = byId.get(row.event_id) ?? null;
  }
  return rows;
}

/**
 * Alla kommande publicerade event (bara listfälten), cachade i Next:s datacache.
 * Startsidan, eventsidornas "liknande event", arrangörssidorna och /api/events
 * delar samma hämtning - Supabase anropas högst var 5:e minut i stället för vid
 * varje sidvisning (tidigare select(*) per request ≈ 1 MB, se egress-problemet
 * november 2026). Sidorna renderas fortfarande per request.
 */
export const getUpcomingEventRows = unstable_cache(loadUpcomingEventRows, ["upcoming-event-rows-v1"], {
  revalidate: 300,
  tags: ["events"],
});

export async function getHomeEvents(): Promise<EventDisplay[]> {
  try {
    return buildPublishedEvents(await getUpcomingEventRows()).map(toListEvent);
  } catch (error) {
    console.error("Error fetching home events:", error);
    return [];
  }
}

export async function getEventById(id: string): Promise<EventDisplay | null> {
  const { data, error } = await supabase
    .from("events")
    .select(`*, organizer:organizers(*)`)
    .eq("event_id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("Error fetching event:", error);
    return null;
  }
  return data ? transformEventForDisplay(data) : null;
}

export async function getEventRelations(event: EventDisplay): Promise<SimilarEventsResult> {
  try {
    const result = buildSimilarEvents(event, await getUpcomingEventRows());
    return {
      ...result,
      similar: result.similar.map(toListEvent),
      sameSeries: result.sameSeries.map(toListEvent),
    };
  } catch (error) {
    console.error("Error fetching similar events:", error);
    return { similar: [], sameSeries: [], similarIsFallback: false };
  }
}

export interface OrganizerPageData {
  id: number;
  slug: string;
  name: string;
  title: string;
  description: string;
  content: string;
  hero_image_url: string;
  gallery_images: string[];
  organizer_id: number | null;
  contact_info: { email?: string; phone?: string; website?: string; address?: string };
  social_links: { facebook?: string; instagram?: string; twitter?: string };
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  is_published: boolean;
}

export async function getOrganizerPage(slug: string): Promise<OrganizerPageData | null> {
  const { data, error } = await supabase
    .from("organizer_pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("Error fetching organizer:", error);
    return null;
  }
  return data;
}

export async function getOrganizerEvents(organizerId: number | null): Promise<EventDisplay[]> {
  if (!organizerId) return [];
  try {
    return buildOrganizerEvents(await getUpcomingEventRows(), organizerId).map(toListEvent);
  } catch (error) {
    console.error("Error fetching organizer events:", error);
    return [];
  }
}
