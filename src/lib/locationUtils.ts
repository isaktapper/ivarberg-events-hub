// Utility-funktioner för plats-formatering

export interface LocationDisplay {
  venueName: string | null;
  address: string;
  hasVenueName: boolean;
}

/**
 * Formaterar plats-information för visning
 * @param venue_name - Platsnamn (t.ex. "Varbergs Teater")
 * @param location - Adress (t.ex. "Teatergatan 1, 432 40 Varberg")
 * @returns Formaterad plats-information
 */
export function formatLocation(venue_name: string | null, location: string): LocationDisplay {
  return {
    venueName: venue_name && venue_name.trim() !== '' ? venue_name : null,
    address: location,
    hasVenueName: !!(venue_name && venue_name.trim() !== '')
  };
}

/**
 * Returnerar primär plats-text för visning
 * @param venue_name - Platsnamn
 * @param location - Adress
 * @returns Primär text att visa (platsnamn om det finns, annars adress)
 */
export function getPrimaryLocationText(venue_name: string | null, location: string): string {
  const formatted = formatLocation(venue_name, location);
  return formatted.hasVenueName ? formatted.venueName! : formatted.address;
}

/**
 * Returnerar sekundär plats-text för visning
 * @param venue_name - Platsnamn
 * @param location - Adress
 * @returns Sekundär text att visa (adress om platsnamn finns, annars null)
 */
export function getSecondaryLocationText(venue_name: string | null, location: string): string | null {
  const formatted = formatLocation(venue_name, location);
  return formatted.hasVenueName ? formatted.address : null;
}
