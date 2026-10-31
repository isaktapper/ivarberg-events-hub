// Gemensam sidbyggare för kategori- och områdessidorna (/kategori/:slug,
// /omrade/:slug). Handlarna i api/kategori.ts och api/omrade.ts hämtar data
// och anropar buildTaxonomyPage – allt innehåll/rendering ligger här.

import { SITE, CATEGORIES, AREAS, type TaxonomyEntry } from './constants';
import { organizerSlug, type DbEvent } from './supabase';
import { escapeHtml, eventDayLabel, pickHighlights, dedupeByName } from './events';
import { pageJsonLd } from './jsonld';
import {
  layout,
  highlightCard,
  eventRow,
  recommendationGrid,
  areaChipRow,
  periodChipRow,
  chipRow,
} from './render';
import { recsForCategory, recsForArea, type Recommendation } from './recommendations';

export type TaxonomyKind = 'kategori' | 'omrade';

export function buildTaxonomyPage(opts: {
  kind: TaxonomyKind;
  entry: TaxonomyEntry;
  events: DbEvent[];
  fallback: boolean; // true = inga event i fönstret, events är "under tiden"-lista
}): string {
  const { kind, entry, fallback } = opts;
  // Serie-event (en rad per dag) visas som nästa förekomst per namn
  const events = dedupeByName(opts.events);
  const path = `/${kind}/${entry.slug}`;
  const canonical = `${SITE}${path}`;
  const title = `${entry.titleLabel} | ivarberg.nu`;
  const inPhrase = kind === 'kategori' ? `inom ${entry.name.toLowerCase()} i Varberg` : `i ${entry.name}`;

  const metaDescription = fallback
    ? `${entry.emptyNote} Se våra tips och det som händer i Varberg – uppdateras dagligen.`
    : `${events.length} kommande evenemang ${inPhrase}: ${events
        .slice(0, 3)
        .map((e) => e.name)
        .join(', ')}. Tider, platser och priser – uppdateras dagligen.`;

  const recs: Recommendation[] =
    kind === 'kategori' ? recsForCategory(entry.slug) : recsForArea(entry.slug);
  const recsTitle =
    kind === 'kategori'
      ? entry.slug === 'mat-dryck'
        ? 'Bästa restaurangerna i Varberg – våra tips'
        : 'Våra tips'
      : `Våra tips i ${entry.name}`;

  // Intro: unik prosa + dynamisk mening om det närmaste i kalendern
  const dynamic =
    !fallback && events.length > 0
      ? ` Närmast i kalendern: ${events
          .slice(0, 3)
          .map((e) => `${e.name} (${eventDayLabel(e)})`)
          .join(', ')}.`
      : '';
  const introText = entry.intro + dynamic;

  const highlights = !fallback && events.length >= 3 ? pickHighlights(events) : [];
  const listEvents = events;

  // Arrangörer med egna sidor, ur eventens organizer-embed
  const organizerChips = [
    ...new Map(
      listEvents
        .filter((e) => organizerSlug(e))
        .map((e) => [
          organizerSlug(e)!,
          { href: `/arrangor/${organizerSlug(e)}`, label: e.organizer!.name },
        ])
    ).values(),
  ].slice(0, 6);

  const related = entry.relatedSlugs
    .map((slug) =>
      kind === 'kategori'
        ? { entry: CATEGORIES.find((c) => c.slug === slug), href: `/kategori/${slug}` }
        : { entry: AREAS.find((a) => a.slug === slug), href: `/omrade/${slug}` }
    )
    .filter((r) => r.entry)
    .map((r) => ({ href: r.href, label: r.entry!.name }));

  const sections: string[] = [];

  sections.push(`  <div class="intro">
    <input type="checkbox" id="intro-toggle" hidden>
    <p class="intro-text">${escapeHtml(introText)}</p>
    <label for="intro-toggle" class="intro-more"><span class="show">Visa mer</span><span class="hide">Visa mindre</span></label>
  </div>`);

  if (recs.length > 0) {
    sections.push(`  <h2>${escapeHtml(recsTitle)}</h2>
${recommendationGrid(recs, path)}`);
  }

  if (fallback) {
    sections.push(`  <div class="intro"><p>${escapeHtml(entry.emptyNote)}</p></div>`);
    if (listEvents.length > 0) {
      sections.push(`  <h2>Under tiden – kommande evenemang i Varberg</h2>
  <ul class="events">
${listEvents.map((e) => eventRow(e)).join('\n')}
  </ul>`);
    }
  } else {
    if (highlights.length > 0) {
      sections.push(`  <h2>Höjdpunkter</h2>
  <div class="grid3">
${highlights.map((e) => highlightCard(e)).join('\n')}
  </div>`);
    }
    sections.push(`  <h2>Alla kommande evenemang (${listEvents.length})</h2>
  <ul class="events">
${listEvents.map((e) => eventRow(e)).join('\n')}
  </ul>`);
  }

  if (organizerChips.length > 0) {
    sections.push(`  <h2>Arrangörer ${kind === 'kategori' ? 'inom kategorin' : 'i området'}</h2>
${chipRow(organizerChips)}`);
  }

  if (related.length > 0) {
    sections.push(`  <h2>${kind === 'kategori' ? 'Relaterade kategorier' : 'Andra områden'}</h2>
${chipRow(related)}`);
  }

  sections.push(`  <h2>När passar det dig?</h2>
${periodChipRow()}
  <h2>Utforska per område</h2>
${areaChipRow(kind === 'omrade' ? entry.slug : undefined)}
  <div class="cta-wrap"><a class="cta" href="/evenemang-varberg">Hela guiden: Evenemang i Varberg</a></div>`);

  return layout({
    title,
    metaDescription,
    canonical,
    jsonLd: pageJsonLd({
      url: canonical,
      title,
      description: metaDescription,
      pageType: 'CollectionPage',
      breadcrumbs: [
        { name: 'ivarberg.nu', item: SITE },
        { name: 'Evenemang i Varberg', item: `${SITE}/evenemang-varberg` },
        { name: entry.h1, item: canonical },
      ],
      events: listEvents,
    }),
    h1: entry.h1,
    heroSub: fallback
      ? 'Se våra tips och kommande evenemang'
      : `${listEvents.length} kommande evenemang`,
    main: sections.join('\n'),
  });
}

// 404 för okänd slug – riktig 404-status med noindex och vägar vidare
export function taxonomy404(kind: TaxonomyKind): string {
  const label = kind === 'kategori' ? 'kategorin' : 'området';
  const main = `  <div class="intro"><p>Vi hittar inte ${label} du letar efter. Den kan ha bytt namn – här är vägarna vidare:</p></div>
  <h2>Utforska i stället</h2>
${kind === 'kategori' ? periodChipRow() : ''}
${kind === 'omrade' ? areaChipRow() : ''}
  <div class="cta-wrap"><a class="cta" href="/evenemang-varberg">Alla kategorier och områden</a></div>`;
  return layout({
    title: 'Sidan hittades inte | ivarberg.nu',
    metaDescription: 'Sidan hittades inte.',
    canonical: SITE,
    jsonLd: '',
    h1: 'Sidan hittades inte',
    heroSub: 'Men det händer massor i Varberg ändå',
    main,
    robots: 'noindex',
  });
}
