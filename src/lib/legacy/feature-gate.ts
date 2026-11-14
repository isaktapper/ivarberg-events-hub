/**
 * Stänger av en serverrenderad sida för städer som inte har delen påslagen
 * (guider, säsongssidor, kategori- och områdessidor har stadsunika texter).
 * Avstängd del svarar 404, så att den inte indexeras med en annan stads text.
 */

import { getSite } from "@/config/site.server";
import type { SiteConfig, SiteFeatures } from "@/config/site";

type RouteHandler = (request: Request, context?: { params?: Promise<Record<string, string>> }) => Promise<Response>;

export function requireFeature(feature: keyof SiteFeatures, handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    const site = await getSite();
    if (!site.features[feature]) {
      return new Response("Sidan finns inte.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" } });
    }
    const response = await handler(request, context);
    return withSiteColors(response, site);
  };
}

/**
 * De serverrenderade sidorna har egen CSS. Har staden egna färger (satta i
 * admin) läggs de in som variabler som sidfoten läser. Utan egna färger
 * lämnas sidan orörd.
 */
async function withSiteColors(response: Response, site: SiteConfig): Promise<Response> {
  const colors = site.theme.colors;
  if (!colors || !(response.headers.get("Content-Type") || "").includes("text/html")) return response;
  const html = await response.text();
  const vars = `<style>:root{--sf-dark:${colors.dark};--sf-hl:${colors.highlight}}</style>`;
  const body = html.includes("</head>") ? html.replace("</head>", `${vars}</head>`) : html;
  return new Response(body, { status: response.status, headers: response.headers });
}
