import type { VercelRequest, VercelResponse } from '@vercel/node';

// Denna funktion genererar en dynamisk sitemap med alla events
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Hämta Supabase credentials från environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return res.status(500).send('Server configuration error');
    }

    // Hämta alla publishade events direkt med fetch (undvik att importera hela Supabase-klienten)
    const eventsResponse = await fetch(`${supabaseUrl}/rest/v1/events?status=eq.published&select=event_id,updated_at,date`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (!eventsResponse.ok) {
      console.error('Failed to fetch events:', eventsResponse.statusText);
      return res.status(500).send('Failed to fetch events');
    }

    const events = await eventsResponse.json();

    // Statiska sidor
    const staticPages = [
      { 
        url: 'https://ivarberg.nu/', 
        priority: '1.0', 
        changefreq: 'daily',
        lastmod: new Date().toISOString().split('T')[0]
      },
      { 
        url: 'https://ivarberg.nu/evenemang-varberg', 
        priority: '0.9', 
        changefreq: 'weekly',
        lastmod: new Date().toISOString().split('T')[0]
      },
      { 
        url: 'https://ivarberg.nu/att-gora-i-varberg', 
        priority: '0.9', 
        changefreq: 'weekly',
        lastmod: new Date().toISOString().split('T')[0]
      },
      { 
        url: 'https://ivarberg.nu/varberg-kalender', 
        priority: '0.9', 
        changefreq: 'weekly',
        lastmod: new Date().toISOString().split('T')[0]
      },
      { 
        url: 'https://ivarberg.nu/om-oss', 
        priority: '0.7', 
        changefreq: 'monthly',
        lastmod: new Date().toISOString().split('T')[0]
      },
      { 
        url: 'https://ivarberg.nu/tips', 
        priority: '0.8', 
        changefreq: 'monthly',
        lastmod: new Date().toISOString().split('T')[0]
      }
    ];

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
    <loc>https://ivarberg.nu/event/${event.event_id}</loc>
    <lastmod>${event.updated_at ? new Date(event.updated_at).toISOString().split('T')[0] : new Date(event.date).toISOString().split('T')[0]}</lastmod>
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
    return res.status(500).send('Error generating sitemap');
  }
}

