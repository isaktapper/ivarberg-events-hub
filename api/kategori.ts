import type { VercelRequest, VercelResponse } from '@vercel/node';

// Serverrenderad kategorisida: /kategori/:slug -> /api/kategori?slug=:slug
// (rewrite i vercel.json). Kurerade tips + kommande event i kategorin.

import { categoryBySlug } from './_lib/constants';
import { stockholmToday, addDays } from './_lib/dates';
import { fetchEvents } from './_lib/supabase';
import { buildTaxonomyPage, taxonomy404 } from './_lib/taxonomy-page';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const slug = typeof req.query.slug === 'string' ? req.query.slug : '';
    const entry = categoryBySlug(slug);
    if (!entry) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      return res.status(404).send(taxonomy404('kategori'));
    }

    const today = stockholmToday();
    let events = await fetchEvents({ from: today, to: addDays(today, 60), category: entry.name, limit: 100 });
    if (events === null) {
      res.setHeader('Cache-Control', 'no-store');
      return res.redirect(302, '/');
    }

    let fallback = false;
    if (events.length === 0) {
      fallback = true;
      events = (await fetchEvents({ from: today, to: addDays(today, 14), limit: 10 })) || [];
    }

    const html = buildTaxonomyPage({ kind: 'kategori', entry, events, fallback });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Error rendering category page:', error);
    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(302, '/');
  }
}
