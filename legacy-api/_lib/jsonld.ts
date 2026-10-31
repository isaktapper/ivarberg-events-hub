import { SITE } from './constants';
import type { DbEvent } from './supabase';
import { parsePrice, plainText } from './events';

// JSON-LD-byggare för de serverrenderade sidorna.
// eventJsonLd flyttad oförändrad från api/landing.ts; pageJsonLd är en
// generalisering av dess jsonLdScript (samma nyckelordning => samma bytes).

export function eventJsonLd(e: DbEvent) {
  const price = parsePrice(e.price);
  const ld: Record<string, unknown> = {
    '@type': 'Event',
    name: e.name,
    startDate: e.date_time,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url: `${SITE}/event/${e.event_id}`,
    location: {
      '@type': 'Place',
      name: e.venue_name || 'Varberg',
      address: e.location || 'Varberg, Sweden',
    },
  };
  if (e.description) ld.description = plainText(e.description, 300);
  if (e.image_url) ld.image = e.image_url;
  if (price.amount !== null) {
    ld.isAccessibleForFree = price.free;
    ld.offers = {
      '@type': 'Offer',
      price: price.amount,
      priceCurrency: 'SEK',
      url: `${SITE}/event/${e.event_id}`,
      availability: 'https://schema.org/InStock',
    };
  }
  return ld;
}

export interface Crumb { name: string; item: string }
export interface FaqItem { q: string; a: string }

export function pageJsonLd(opts: {
  url: string;
  title: string;
  description: string;
  breadcrumbs: Crumb[];
  events: DbEvent[];
  pageType?: 'WebPage' | 'CollectionPage';
  faq?: FaqItem[];
}): string {
  const graph: unknown[] = [
    {
      '@type': opts.pageType || 'WebPage',
      '@id': opts.url,
      url: opts.url,
      name: opts.title,
      description: opts.description,
      inLanguage: 'sv-SE',
      isPartOf: { '@type': 'WebSite', name: 'ivarberg.nu', url: SITE },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: opts.breadcrumbs.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        item: c.item,
      })),
    },
    {
      '@type': 'ItemList',
      itemListElement: opts.events.map((e, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: eventJsonLd(e),
      })),
    },
  ];
  if (opts.faq && opts.faq.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: opts.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}
