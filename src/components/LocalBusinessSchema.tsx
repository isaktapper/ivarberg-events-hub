"use client";

import { Helmet } from "@/lib/helmet";
import { useSite } from "@/config/SiteProvider";
import { VARBERG_SLUG } from "@/config/site";

/**
 * LocalBusiness Schema for ivarberg.nu
 * Helps Google understand we're a local event listing service for Varberg
 */
export function LocalBusinessSchema() {
  const site = useSite();
  const absolute = (path: string) => (/^https?:\/\//.test(path) ? path : `${site.url}${path}`);
  // Varbergs bild är stadsunik; andra städer får sin delningsbild om den finns
  const image = site.slug === VARBERG_SLUG ? "https://ivarberg.nu/varberg_hero.jpg" : site.theme.ogImage;
  // Fält som saknas för staden utelämnas. Ordningen är densamma som tidigare.
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": site.name,
    "description": `Din kompletta guide till evenemang i ${site.cityName}. Vi samlar alla konserter, teater, sport, restauranger och aktiviteter på ett ställe.`,
    "url": site.url,
    ...(site.theme.logo ? { "logo": absolute(site.theme.logo) } : {}),
    ...(image ? { "image": image } : {}),
    "address": {
      "@type": "PostalAddress",
      "addressLocality": site.cityName,
      "addressCountry": "SE"
    },
    ...(site.contact.email ? { "email": site.contact.email } : {}),
    "areaServed": {
      "@type": "City",
      "name": site.cityName,
      ...(site.geo.region
        ? {
            "containedInPlace": {
              "@type": "AdministrativeArea",
              "name": site.geo.region
            }
          }
        : {})
    },
    ...(site.geo.latitude !== null && site.geo.longitude !== null
      ? {
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": String(site.geo.latitude),
            "longitude": String(site.geo.longitude)
          }
        }
      : {}),
    "priceRange": "Gratis",
    ...(site.contact.instagramUrl ? { "sameAs": [site.contact.instagramUrl] } : {})
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}

