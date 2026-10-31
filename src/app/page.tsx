import type { Metadata } from "next";
import Index from "@/views/Index";
import { getHomeEvents } from "@/lib/server-data";

// Renderas per request: listan är alltid färsk och filtren i URL:en
// (?cat=, ?date=, ?search= …) följer med i serverrenderingen
export const dynamic = "force-dynamic";

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
  return <Index initialEvents={events} />;
}
