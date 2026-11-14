import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventDetail from "@/views/EventDetail";
import { getEventById, getEventRelations } from "@/lib/server-data";
import { getAllCategories } from "@/types/event";
import { getSite } from "@/config/site.server";

// Varje sida renderas vid första besöket, cachas och renderas om högst var
// 5:e minut. Tom generateStaticParams = inget byggs i förväg, men sidan blir
// ISR i stället för att renderas vid varje besök.
export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

// generateMetadata och sidan delar samma hämtning
const loadEvent = cache((id: string) => getEventById(id));

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [event, site] = await Promise.all([loadEvent(id), getSite()]);
  if (!event) {
    return { title: `Evenemang hittades inte | ${site.name}`, robots: { index: false } };
  }
  const city = site.cityName;

  // Samma texter som SPA:n satte via react-helmet
  const cleanDescription = event.description.replace(/[#*_\[\]`]/g, "").replace(/\n+/g, " ");
  const seoDescription = `${event.title} i ${city} - ${event.date.toLocaleDateString("sv-SE")}${
    event.time ? ` kl ${event.time}` : ""
  }. ${cleanDescription.substring(0, 120)}...`;
  const eventUrl = `${site.url}/event/${id}`;

  return {
    title: `${event.title} - Evenemang i ${city} | ${site.name}`,
    description: seoDescription,
    keywords: `${event.title}, evenemang ${city}, ${getAllCategories(event).join(", ")}, event ${city}, ${city} evenemang`,
    alternates: { canonical: eventUrl },
    openGraph: {
      title: `${event.title} - ${site.name}`,
      description: seoDescription,
      type: "website",
      url: eventUrl,
      images: [event.image],
      locale: "sv_SE",
    },
    twitter: {
      card: "summary_large_image",
      title: `${event.title} - ${site.name}`,
      description: seoDescription,
      images: [event.image],
    },
  };
}

export default async function EventPage({ params }: Props) {
  const { id } = await params;
  const event = await loadEvent(id);
  if (!event) notFound();

  const relations = await getEventRelations(event);
  // key: ny komponentinstans per event (t.ex. vid klick i "Liknande evenemang")
  return <EventDetail key={id} initialEvent={event} initialRelations={relations} />;
}
