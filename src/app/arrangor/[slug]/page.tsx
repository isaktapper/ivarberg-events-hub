import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import OrganizerPage from "@/views/OrganizerPage";
import { getOrganizerEvents, getOrganizerPage } from "@/lib/server-data";

export const dynamic = "force-dynamic";

const loadOrganizer = cache((slug: string) => getOrganizerPage(slug));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const organizer = await loadOrganizer(slug);
  if (!organizer) {
    return { title: "Arrangör hittades inte | ivarberg.nu", robots: { index: false } };
  }

  const url = `https://ivarberg.nu/arrangor/${slug}`;
  return {
    title: `${organizer.name} - Arrangör i Varberg | ivarberg.nu`,
    description:
      organizer.seo_description ||
      organizer.description ||
      `${organizer.name} arrangerar evenemang i Varberg. Se kommande evenemang och kontaktuppgifter.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${organizer.name} - Arrangör i Varberg`,
      description:
        organizer.seo_description || organizer.description || `${organizer.name} arrangerar evenemang i Varberg.`,
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
