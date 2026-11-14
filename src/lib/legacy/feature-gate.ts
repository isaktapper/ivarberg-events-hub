/**
 * Stänger av en serverrenderad sida för städer som inte har delen påslagen
 * (guider, säsongssidor, kategori- och områdessidor har stadsunika texter).
 * Avstängd del svarar 404, så att den inte indexeras med en annan stads text.
 */

import { getSite } from "@/config/site.server";
import type { SiteFeatures } from "@/config/site";

type RouteHandler = (request: Request, context?: { params?: Promise<Record<string, string>> }) => Promise<Response>;

export function requireFeature(feature: keyof SiteFeatures, handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    const site = await getSite();
    if (!site.features[feature]) {
      return new Response("Sidan finns inte.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" } });
    }
    return handler(request, context);
  };
}
