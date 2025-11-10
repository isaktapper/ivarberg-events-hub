import type { VercelRequest, VercelResponse } from '@vercel/node';

// Denna funktion genererar en dynamisk sitemap med alla events
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Hämta Supabase credentials från environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let events: any[] = [];

    // Försök hämta events om credentials finns
    if (supabaseUrl && supabaseKey) {
      try {
        const eventsResponse = await fetch(`${supabaseUrl}/rest/v1/events?status=eq.published&select=event_id,updated_at,date`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (eventsResponse.ok) {
          events = await eventsResponse.json();
        } else {
          console.error('Failed to fetch events:', eventsResponse.statusText);
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
    
    // Fallback: returnera åtminstone de statiska sidorna
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://ivarberg.nu/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://ivarberg.nu/evenemang-varberg</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://ivarberg.nu/att-gora-i-varberg</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://ivarberg.nu/varberg-kalender</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://ivarberg.nu/om-oss</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://ivarberg.nu/tips</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
    
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(fallbackSitemap);
  }
}

