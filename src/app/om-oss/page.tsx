import type { Metadata } from "next";
import About from "@/views/About";
import { getSite } from "@/config/site.server";
import { VARBERG_SLUG } from "@/config/site";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const city = site.cityName;
  return {
    title: `Om oss - Evenemang i ${city} | ${site.name}`,
    description: `${site.name} är din kompletta guide till evenemang i ${city}. Vi samlar alla konserter, teater, sport och aktiviteter på ett ställe. Läs mer om vår vision och kontakta oss!`,
    keywords: `om ${site.slug === VARBERG_SLUG ? "ivarberg" : site.name}, evenemang ${city}, kontakt, arrangörer ${city}, event kalender ${city}`,
    alternates: { canonical: `${site.url}/om-oss` },
    openGraph: {
      title: `Om oss - ${site.name}`,
      description: `Din kompletta guide till evenemang i ${city}. Vi samlar alla konserter, teater, sport och aktiviteter på ett ställe.`,
      type: "website",
      url: `${site.url}/om-oss`,
      ...(site.theme.ogImage ? { images: [site.theme.ogImage] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `Om oss - ${site.name}`,
      description: `Din kompletta guide till evenemang i ${city}`,
    },
  };
}

export default function AboutPage() {
  return <About />;
}
