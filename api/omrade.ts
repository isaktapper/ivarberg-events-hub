import type { VercelRequest, VercelResponse } from '@vercel/node';

// Serverrenderad områdessida: /omrade/:slug -> /api/omrade?slug=:slug
// (rewrite i vercel.json). Kurerade områdestips + kommande event i området.

import { areaBySlug } from './_lib/constants.js';
import { stockholmToday, addDays } from './_lib/dates.js';
import { fetchEvents } from './_lib/supabase.js';
import { buildTaxonomyPage, taxonomy404 } from './_lib/taxonomy-page.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const slug = typeof req.query.slug === 'string' ? req.query.slug : '';
    const entry = areaBySlug(slug);
    if (!entry) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      return res.status(404).send(taxonomy404('omrade'));
    }

    const today = stockholmToday();
    let events = await fetchEvents({ from: today, to: addDays(today, 60), area: entry.name, limit: 100 });
    if (events === null) {
      res.setHeader('Cache-Control', 'no-store');
      return res.redirect(302, '/');
    }

    let fallback = false;
    if (events.length === 0) {
      fallback = true;
      events = (await fetchEvents({ from: today, to: addDays(today, 14), limit: 10 })) || [];
    }

    const html = buildTaxonomyPage({ kind: 'omrade', entry, events, fallback });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Error rendering area page:', error);
    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(302, '/');
  }
}
