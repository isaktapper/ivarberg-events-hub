import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import OrganizerPage from "@/views/OrganizerPage";
import { getOrganizerEvents, getOrganizerPage } from "@/lib/server-data";
import { getSite } from "@/config/site.server";

// Varje sida renderas vid första besöket, cachas och renderas om högst var
// 5:e minut. Tom generateStaticParams = inget byggs i förväg, men sidan blir
// ISR i stället för att renderas vid varje besök.
export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

const loadOrganizer = cache((slug: string) => getOrganizerPage(slug));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [organizer, site] = await Promise.all([loadOrganizer(slug), getSite()]);
  if (!organizer) {
    return { title: `Arrangör hittades inte | ${site.name}`, robots: { index: false } };
  }

  const url = `${site.url}/arrangor/${slug}`;
  return {
    title: `${organizer.name} - Arrangör i ${site.cityName} | ${site.name}`,
    description:
      organizer.seo_description ||
      organizer.description ||
      `${organizer.name} arrangerar evenemang i ${site.cityName}. Se kommande evenemang och kontaktuppgifter.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${organizer.name} - Arrangör i ${site.cityName}`,
      description:
        organizer.seo_description || organizer.description || `${organizer.name} arrangerar evenemang i ${site.cityName}.`,
      type: "website",
      url,
      ...(organizer.hero_image_url ? { images: [organizer.hero_image_url] } : {}),
    },
  };
}

export default async function OrganizerRoute({ params }: Props) {
  const { slug } = await params;
  const organizer = await loadOrganizer(slug);
  if (!organizer) notFound();

  const events = await getOrganizerEvents(organizer.organizer_id);
  return <OrganizerPage key={slug} initialOrganizer={organizer} initialEvents={events} />;
}
