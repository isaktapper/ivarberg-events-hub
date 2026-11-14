import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CATEGORIES, AREAS } from './_lib/constants';
import { SEASONS } from './_lib/seasons';
import { getSite, municipalityQuery } from '../src/config/site.server';

// Denna funktion genererar en dynamisk sitemap med alla events
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Domän, påslagna delar och kommunfilter kommer från stadskonfigurationen
  const site = await getSite();
  const SITE = site.url;
  const { guides, seasons, taxonomyPages } = site.features;

  try {
    // Hämta Supabase credentials från environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let events: any[] = [];

    // Försök hämta events om credentials finns
    if (supabaseUrl && supabaseKey) {
      try {
        // Endast kommande event – passerade event ska inte fylla sitemapen
        const today = new Date().toISOString().split('T')[0];
        const eventsResponse = await fetch(`${supabaseUrl}/rest/v1/events?status=eq.published&date_time=gte.${today}&select=event_id,updated_at,date_time&limit=5000${municipalityQuery(site)}`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (eventsResponse.ok) {
          events = await eventsResponse.json();
        } else {
          const body = await eventsResponse.text();
          console.error(`Failed to fetch events: HTTP ${eventsResponse.status} ${eventsResponse.statusText} - ${body.slice(0, 300)}`);
          // Fortsätt ändå med tom events array
        }
      } catch (fetchError) {
        console.error('Error fetching events:', fetchError);
        // Fortsätt ändå med tom events array
      }
    } else {
      console.warn('Missing Supabase credentials - generating sitemap without events');
    }

    // Statiska sidor
    const staticPages = [
      { 
        url: `${SITE}/`, 
        priority: '1.0', 
        changefreq: 'daily',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: `${SITE}/idag`,
        priority: '0.9',
        changefreq: 'daily',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: `${SITE}/imorgon`,
        priority: '0.9',
        changefreq: 'daily',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: `${SITE}/i-helgen`,
        priority: '0.9',
        changefreq: 'daily',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: `${SITE}/i-veckan`,
        priority: '0.9',
        changefreq: 'daily',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: `${SITE}/evenemang-varberg`,
        priority: '0.9',
        changefreq: 'daily',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: `${SITE}/att-gora-i-varberg`,
        priority: '0.9',
        changefreq: 'daily',
        lastmod: new Date().toISOString().split('T')[0]
      },
      {
        url: `${SITE}/varberg-kalender`,
        priority: '0.9',
        changefreq: 'daily',
        lastmod: new Date().toISOString().split('T')[0]
      },
      // Säsongssidorna (jul, sommar, loven …)
      ...SEASONS.map((season) => ({
        url: `${SITE}/${season.slug}`,
        priority: '0.9',
        changefreq: 'daily',
        lastmod: new Date().toISOString().split('T')[0]
      })),
      // Kategori- och områdessidor (serverrenderade, dagsfärsk eventdata)
      ...CATEGORIES.map((c) => ({
        url: `${SITE}/kategori/${c.slug}`,
        priority: '0.8',
        changefreq: 'daily',
        lastmod: new Date().toISOString().split('T')[0]
      })),
      ...AREAS.map((a) => ({
        url: `${SITE}/omrade/${a.slug}`,
        priority: '0.7',
        changefreq: 'daily',
        lastmod: new Date().toISOString().split('T')[0]
      })),
      {
        url: `${SITE}/om-oss`, 
        priority: '0.7', 
        changefreq: 'monthly',
        lastmod: new Date().toISOString().split('T')[0]
      },
      { 
        url: `${SITE}/tips`, 
        priority: '0.8', 
        changefreq: 'monthly',
        lastmod: new Date().toISOString().split('T')[0]
      }
    ].filter((page) => {
      // Delar som är avstängda för staden (svarar 404) ska inte stå i sitemapen
      const path = page.url.slice(SITE.length);
      if (path === '/' || path === '/om-oss' || path === '/tips') return true;
      if (path.startsWith('/kategori/') || path.startsWith('/omrade/')) return taxonomyPages;
      if (SEASONS.some((season) => path === `/${season.slug}`)) return seasons;
      return guides;
    });

    // Generera sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
${events && events.length > 0 ? events.map((event: any) => `  <url>
    <loc>${SITE}/event/${event.event_id}</loc>
    <lastmod>${event.updated_at ? new Date(event.updated_at).toISOString().split('T')[0] : new Date(event.date_time).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`).join('\n') : ''}
</urlset>`;

    // Sätt rätt headers
    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    
    return res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // En stad utan guider, säsonger och kategorisidor: bara de sidor som finns
    if (!guides || !seasons || !taxonomyPages) {
      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE}/om-oss</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE}/tips</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`);
    }

    // Fallback: returnera åtminstone de statiska sidorna
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE}/evenemang-varberg</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE}/att-gora-i-varberg</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE}/varberg-kalender</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
${SEASONS.map((season) => `  <url>
    <loc>${SITE}/${season.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`).join('')}${CATEGORIES.map((c) => `  <url>
    <loc>${SITE}/kategori/${c.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
${AREAS.map((a) => `  <url>
    <loc>${SITE}/omrade/${a.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
  <url>
    <loc>${SITE}/om-oss</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE}/tips</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
    
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(fallbackSitemap);
  }
}

