import { Helmet } from 'react-helmet-async';

/**
 * LocalBusiness Schema for ivarberg.nu
 * Helps Google understand we're a local event listing service for Varberg
 */
export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "ivarberg.nu",
    "description": "Din kompletta guide till evenemang i Varberg. Vi samlar alla konserter, teater, sport, restauranger och aktiviteter på ett ställe.",
    "url": "https://ivarberg.nu",
    "logo": "https://ivarberg.nu/logo.png",
    "image": "https://ivarberg.nu/varberg_hero.jpg",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Varberg",
      "addressCountry": "SE"
    },
    "email": "info@ivarberg.nu",
    "areaServed": {
      "@type": "City",
      "name": "Varberg",
      "containedInPlace": {
        "@type": "AdministrativeArea",
        "name": "Halland"
      }
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "57.1057",
      "longitude": "12.2502"
    },
    "priceRange": "Gratis",
    "sameAs": [
      "https://instagram.com/ivarberg.nu"
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}

