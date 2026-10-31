/**
 * Datahämtning för serverrenderingen. Samma frågor som klienten gjorde
 * tidigare (eventService), men körs nu på servern så att innehållet finns i
 * HTML:en från start.
 */

import { supabase } from "@/lib/supabase";
import {
  getEventsByOrganizerId,
  getPublishedEvents,
  getSimilarEvents,
  transformEventForDisplay,
  type SimilarEventsResult,
} from "@/services/eventService";
import type { EventDisplay } from "@/types/event";

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

export async function getHomeEvents(): Promise<EventDisplay[]> {
  const events = await getPublishedEvents();
  return events.map(toListEvent);
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
    const result = await getSimilarEvents(event);
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
  const events = await getEventsByOrganizerId(organizerId);
  return events.map(toListEvent);
}
