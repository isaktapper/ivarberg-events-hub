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
  return `/api/bild?w=${width}&src=${toBase64Url(url)}`;
}

// Käll-URL:en skickas base64url-kodad: många bild-URL:er innehåller redan
// %-kodning (t.ex. "Henrik%20Nyblom"), som annars avkodas en gång för mycket
// på vägen och då inte längre matchar databasen.
export function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(value: string): string {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

/** srcset för bilder som kan visas i olika storlekar (t.ex. eventsidans huvudbild) */
export function optimizedSrcSet(url: string | null | undefined, widths: readonly ImageWidth[]): string | undefined {
  if (!url || !/^https?:\/\//i.test(url)) return undefined;
  return widths.map((w) => `${optimizedImage(url, w)} ${w}w`).join(", ");
}
