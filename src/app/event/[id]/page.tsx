import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventDetail from "@/views/EventDetail";
import { getEventById, getEventRelations } from "@/lib/server-data";
import { getAllCategories } from "@/types/event";

export const dynamic = "force-dynamic";

// generateMetadata och sidan delar samma hämtning
const loadEvent = cache((id: string) => getEventById(id));

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await loadEvent(id);
  if (!event) {
    return { title: "Evenemang hittades inte | ivarberg.nu", robots: { index: false } };
  }

  // Samma texter som SPA:n satte via react-helmet
  const cleanDescription = event.description.replace(/[#*_\[\]`]/g, "").replace(/\n+/g, " ");
  const seoDescription = `${event.title} i Varberg - ${event.date.toLocaleDateString("sv-SE")}${
    event.time ? ` kl ${event.time}` : ""
  }. ${cleanDescription.substring(0, 120)}...`;
  const eventUrl = `https://ivarberg.nu/event/${id}`;

  return {
    title: `${event.title} - Evenemang i Varberg | ivarberg.nu`,
    description: seoDescription,
    keywords: `${event.title}, evenemang Varberg, ${getAllCategories(event).join(", ")}, event Varberg, Varberg evenemang`,
    alternates: { canonical: eventUrl },
    openGraph: {
      title: `${event.title} - ivarberg.nu`,
      description: seoDescription,
      type: "website",
      url: eventUrl,
      images: [event.image],
      locale: "sv_SE",
    },
    twitter: {
      card: "summary_large_image",
      title: `${event.title} - ivarberg.nu`,
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
