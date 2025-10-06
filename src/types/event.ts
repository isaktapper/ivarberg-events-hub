export type EventCategory = 
  | "Scen" 
  | "Nattliv" 
  | "Sport" 
  | "Konst" 
  | "Föreläsningar" 
  | "Barn & Familj" 
  | "Mat & Dryck"
  | "Jul"
  | "Film & bio"
  | "Djur & Natur"
  | "Guidade visningar";

export type EventStatus = 'draft' | 'pending_approval' | 'published' | 'cancelled';

export interface Event {
  id: number;
  event_id: string;
  name: string;
  category: EventCategory;
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
  category: EventCategory;
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
  "Konst": "bg-blue-500",
  "Föreläsningar": "bg-yellow-500",
  "Barn & Familj": "bg-slate-700",
  "Mat & Dryck": "bg-red-500",
  "Jul": "bg-red-600",
  "Film & bio": "bg-indigo-500",
  "Djur & Natur": "bg-emerald-600",
  "Guidade visningar": "bg-amber-500",
};