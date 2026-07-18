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

// Områden i Varbergs kommun (matchar area-kolumnen som sätts vid import i admin)
export const EVENT_AREAS = [
  "Centrala Varberg",
  "Getterön",
  "Apelviken",
  "Träslövsläge",
  "Tvååker",
  "Veddige",
  "Bua",
  "Övriga kommunen",
] as const;

export type EventArea = (typeof EVENT_AREAS)[number];

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
  area?: string | null; // Område i Varbergs kommun; null/saknas = okänd plats
  price: string | null;
  is_free?: boolean | null; // true = säkert gratis, false = kostar, null = okänt (sätts i admin, härleds ALDRIG här)
  image_url: string | null;
  description: string | null;
  description_format?: 'markdown' | 'plain'; // Format för beskrivning
  organizer_event_url: string | null;
  event_website?: string | null; // Arrangörens event-sida (används av Visit Varberg)
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
  area?: string | null; // Område i Varbergs kommun; null/saknas = okänd plats
  price: string;
  is_free?: boolean | null; // true = säkert gratis, false = kostar, null = okänt (sätts i admin, härleds ALDRIG här)
  image: string;
  description: string;
  description_format?: 'markdown' | 'plain'; // Format för beskrivning
  isFeatured: boolean;
  organizer_event_url: string | null;
  event_website?: string | null; // Arrangörens event-sida (används av Visit Varberg)
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

// Kategorichips: 12 kategorier delar 6 hue-familjer (hav/tång/tegel/ljung/solgul/flint),
// mörk text på egen ljus tintyta. Alla kombinationer klarar WCAG AA (5,3–7,8:1).
export interface CategoryChipColor {
  text: string;
  bg: string;
}

const CHIP_HAV: CategoryChipColor = { text: '#0F4C81', bg: '#DCE9F7' };
const CHIP_TANG: CategoryChipColor = { text: '#0B5F50', bg: '#DCEEE6' };
const CHIP_TEGEL: CategoryChipColor = { text: '#A63A1B', bg: '#FBE3D6' };
const CHIP_LJUNG: CategoryChipColor = { text: '#8A2455', bg: '#F9E2EC' };
const CHIP_SOLGUL: CategoryChipColor = { text: '#7A5A00', bg: '#FBF0CE' };
const CHIP_FLINT: CategoryChipColor = { text: '#4C3A78', bg: '#ECE5F4' };

const CHIP_FALLBACK: CategoryChipColor = { text: '#4A566B', bg: '#EDEAE2' };

export const categoryChipColors: Record<EventCategory, CategoryChipColor> = {
  "Scen": CHIP_TEGEL,
  "Mat & Dryck": CHIP_TEGEL,
  "Jul": CHIP_TEGEL,
  "Nattliv": CHIP_LJUNG,
  "Sport": CHIP_TANG,
  "Djur & Natur": CHIP_TANG,
  "Utställningar": CHIP_FLINT,
  "Föreläsningar": CHIP_FLINT,
  "Barn & Familj": CHIP_SOLGUL,
  "Marknader": CHIP_SOLGUL,
  "Film & bio": CHIP_HAV,
  "Guidade visningar": CHIP_HAV,
  "Okategoriserad": CHIP_FALLBACK,
};

// Säker uppslagning: databasen kan innehålla kategorier utanför EventCategory-typen
// (t.ex. "Konst") — då används neutral fallback i stället för att krascha.
export function getCategoryChipColor(category: string): CategoryChipColor {
  return categoryChipColors[category as EventCategory] ?? CHIP_FALLBACK;
}

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

// "Övriga kommunen" fångar även events utan säker platsbestämning (area = null)
export function eventMatchesArea(event: Event | EventDisplay, area: string): boolean {
  if (area === "Övriga kommunen") return !event.area || event.area === "Övriga kommunen";
  return event.area === area;
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