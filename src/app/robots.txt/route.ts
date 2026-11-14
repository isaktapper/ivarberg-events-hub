// robots.txt per stad. För ivarberg.nu är svaret ordagrant den fil som tidigare
// låg i public/robots.txt.

import { getSite } from "@/config/site.server";

export const revalidate = 300;

export async function GET(): Promise<Response> {
  const site = await getSite();
  const headers = { "Content-Type": "text/plain; charset=utf-8" };

  // Utkast och pausade städer ska inte indexeras
  if (!site.indexable) return new Response("User-agent: *\nDisallow: /\n", { headers });

  const body = `User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /

# Sitemap
Sitemap: ${site.url}/api/sitemap.xml
`;
  return new Response(body, { headers });
}
