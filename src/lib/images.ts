/**
 * Eventbilder kommer från arrangörernas egna sajter och är ibland enorma
 * (flera MB stora PNG:er) trots att de visas som små kort. optimizedImage()
 * pekar om dem till /api/bild, som skalar ner och gör om till WebP en gång
 * och sedan levereras från Vercels CDN.
 */

// Bredder som /api/bild accepterar (färre varianter = bättre cacheträff)
export const IMAGE_WIDTHS = [320, 480, 640, 960, 1280, 1600] as const;
export type ImageWidth = (typeof IMAGE_WIDTHS)[number];

export function optimizedImage(url: string | null | undefined, width: ImageWidth): string {
  if (!url) return "/placeholder.svg";
  // Lokala filer (t.ex. /placeholder.svg) och data-URL:er lämnas orörda
  if (!/^https?:\/\//i.test(url)) return url;
  return `/api/bild?w=${width}&url=${encodeURIComponent(url)}`;
}

/** srcset för bilder som kan visas i olika storlekar (t.ex. eventsidans huvudbild) */
export function optimizedSrcSet(url: string | null | undefined, widths: readonly ImageWidth[]): string | undefined {
  if (!url || !/^https?:\/\//i.test(url)) return undefined;
  return widths.map((w) => `${optimizedImage(url, w)} ${w}w`).join(", ");
}
