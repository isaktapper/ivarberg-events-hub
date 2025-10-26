export type EventCategory = 
  | "Scen" 
  | "Nattliv" 
  | "Sport" 
  | "Utställningar" 
  | "Föreläsningar" 
  | "Barn & Familj" 
  | "Mat & Dryck"
  | "Jul"
  | "Film & bio"
  | "Djur & Natur"
  | "Guidade visningar"
  | "Marknader"
  | "Okategoriserad";

export interface CategoryScore {
  [category: string]: number; // 0.0 - 1.0
}

export type EventStatus = 'draft' | 'pending_approval' | 'published' | 'cancelled';

export interface Event {
  id: number;
  event_id: string;
  name: string;
  // Gamla systemet (bakåtkompatibilitet)
  category?: EventCategory;
  // Nya systemet
  categories?: EventCategory[];        // 1-3 kategorier, sorterade efter relevans
  category_scores?: CategoryScore;      // Confidence scores
  date_time: string; // ISO string från Supabase
  location: string; // Adress
  venue_name: string | null; // Platsnamn
  price: string | null;
  image_url: string | null;
  description: string | null;
  description_format?: 'markdown' | 'plain'; // Format för beskrivning
  organizer_event_url: string | null;
  featured: boolean;
  status: EventStatus;
  max_participants: number | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  organizer_id: number | null;
  organizer?: Organizer;
}

export interface Organizer {
  id: number;
  name: string;
  location: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

// Helper interface för frontend (transformerad data)
export interface EventDisplay {
  id: string;
  title: string;
  // Gamla systemet (bakåtkompatibilitet)
  category?: EventCategory;
  // Nya systemet
  categories?: EventCategory[];        // 1-3 kategorier, sorterade efter relevans
  category_scores?: CategoryScore;      // Confidence scores
  date: Date;
  time: string;
  location: string; // Adress
  venue_name: string | null; // Platsnamn
  price: string;
  image: string;
  description: string;
  description_format?: 'markdown' | 'plain'; // Format för beskrivning
  isFeatured: boolean;
  organizer_event_url: string | null;
  organizer?: {
    name: string;
    website?: string;
    email?: string;
    phone?: string;
  };
}

export const categoryColors: Record<EventCategory, string> = {
  "Scen": "bg-purple-500",
  "Nattliv": "bg-pink-500",
  "Sport": "bg-green-500",
  "Utställningar": "bg-blue-500",
  "Föreläsningar": "bg-yellow-500",
  "Barn & Familj": "bg-slate-700",
  "Mat & Dryck": "bg-red-500",
  "Jul": "bg-red-600",
  "Film & bio": "bg-indigo-500",
  "Djur & Natur": "bg-emerald-600",
  "Guidade visningar": "bg-amber-500",
  "Marknader": "bg-orange-500",
  "Okategoriserad": "bg-gray-500",
};

// Helper functions för multi-category system
export function getMainCategory(event: Event | EventDisplay): EventCategory {
  return event.categories?.[0] || event.category || 'Okategoriserad';
}

export function hasCategory(event: Event | EventDisplay, category: EventCategory): boolean {
  return event.categories?.includes(category) || event.category === category;
}

export function getAllCategories(event: Event | EventDisplay): EventCategory[] {
  return event.categories || (event.category ? [event.category] : []);
}

export function ensureCategories(event: Event | EventDisplay): Event | EventDisplay {
  if (!event.categories && event.category) {
    return {
      ...event,
      categories: [event.category]
    };
  }
  return event;
}