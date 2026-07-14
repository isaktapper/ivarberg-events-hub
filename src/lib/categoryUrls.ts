import { EventCategory } from "@/types/event";

// Category abbreviations for shorter URLs
export const CATEGORY_TO_ABBREV: Record<EventCategory, string> = {
  'Scen': 'scen',
  'Nattliv': 'natt',
  'Sport': 'sport',
  'Utställningar': 'utst',
  'Föreläsningar': 'forel',
  'Barn & Familj': 'barn',
  'Mat & Dryck': 'mat',
  'Jul': 'jul',
  'Film & bio': 'film',
  'Djur & Natur': 'djur',
  'Guidade visningar': 'guide',
  'Marknader': 'mark',
  'Okategoriserad': 'okat'
};

export const ABBREV_TO_CATEGORY: Record<string, EventCategory> = Object.entries(CATEGORY_TO_ABBREV)
  .reduce((acc, [cat, abbrev]) => ({ ...acc, [abbrev]: cat as EventCategory }), {});

export const categoriesToUrl = (categories: EventCategory[]): string | null => {
  if (categories.length === 0) return null;
  return categories.map(cat => CATEGORY_TO_ABBREV[cat]).join(',');
};

export const urlToCategories = (urlParam: string | null): EventCategory[] => {
  if (!urlParam) return [];
  return urlParam.split(',')
    .map(abbrev => ABBREV_TO_CATEGORY[abbrev])
    .filter((cat): cat is EventCategory => cat !== undefined);
};
