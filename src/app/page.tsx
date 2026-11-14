import type { Metadata } from "next";
import Index from "@/views/Index";
import { getHomeEvents } from "@/lib/server-data";
import { buildHomeRows } from "@/lib/homeRows";
import { getSite } from "@/config/site.server";

// Cachas och renderas om högst var 5:e minut (samma intervall som
// eventdatan i server-data.ts). Filtren i URL:en (?cat=, ?date=, ?search= …)
// läses i webbläsaren efter laddning.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const city = site.cityName;
  const TITLE = `Evenemang i ${city} - Din kompletta eventkalender | ${site.name}`;
  const DESCRIPTION = `Din kompletta guide till ${site.cityGenitive} evenemang. Upptäck konserter, teater, sport, restauranger och aktiviteter för hela familjen. Uppdateras dagligen!`;
  const images = site.theme.ogImage ? { images: [site.theme.ogImage] } : {};

  return {
    title: TITLE,
    description: DESCRIPTION,
    keywords: `evenemang ${city}, ${city} event, att göra ${city}, vad göra ${city}, ${city} kalender, events ${city}, ${city} aktiviteter`,
    alternates: { canonical: `${site.url}/` },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      type: "website",
      url: site.url,
      ...images,
      locale: "sv_SE",
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
      ...images,
    },
  };
}

export default async function HomePage() {
  const events = await getHomeEvents();
  const rows = buildHomeRows(events, new Date());
  return <Index initialEvents={events} rows={rows} />;
}
