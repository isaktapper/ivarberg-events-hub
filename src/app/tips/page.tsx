import type { Metadata } from "next";
import Tips from "@/views/Tips";
import { getSite } from "@/config/site.server";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const city = site.cityName;
  return {
    title: `Tipsa oss om evenemang - ${city} | ${site.name}`,
    description: `Tipsa oss om evenemang i ${city}! Hjälp andra att upptäcka konserter, teater, sport och aktiviteter. Kostnadsfritt att lägga till evenemang på ${site.name}.`,
    keywords: `tipsa evenemang ${city}, lägg till event ${city}, publicera evenemang ${city}, arrangörer ${city}`,
    alternates: { canonical: `${site.url}/tips` },
    openGraph: {
      title: `Tipsa oss om evenemang - ${site.name}`,
      description: `Hjälp andra att upptäcka evenemang i ${city}. Kostnadsfritt att lägga till evenemang!`,
      type: "website",
      url: `${site.url}/tips`,
    },
    twitter: { card: "summary", title: `Tipsa oss om evenemang - ${site.name}` },
  };
}

export default function TipsPage() {
  return <Tips />;
}
