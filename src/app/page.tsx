import type { Metadata } from "next";
import Index from "@/views/Index";
import { getHomeEvents } from "@/lib/server-data";
import { buildHomeRows } from "@/lib/homeRows";

// Cachas och renderas om högst var 5:e minut (samma intervall som
// eventdatan i server-data.ts). Filtren i URL:en (?cat=, ?date=, ?search= …)
// läses i webbläsaren efter laddning.
export const revalidate = 300;

const TITLE = "Evenemang i Varberg - Din kompletta eventkalender | ivarberg.nu";
const DESCRIPTION =
  "Din kompletta guide till Varbergs evenemang. Upptäck konserter, teater, sport, restauranger och aktiviteter för hela familjen. Uppdateras dagligen!";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords:
    "evenemang Varberg, Varberg event, att göra Varberg, vad göra Varberg, Varberg kalender, events Varberg, Varberg aktiviteter",
  alternates: { canonical: "https://ivarberg.nu/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "https://ivarberg.nu",
    images: ["https://ivarberg.nu/og-image.jpg"],
    locale: "sv_SE",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["https://ivarberg.nu/og-image.jpg"],
  },
};

export default async function HomePage() {
  const events = await getHomeEvents();
  const rows = buildHomeRows(events, new Date());
  return <Index initialEvents={events} rows={rows} />;
}
