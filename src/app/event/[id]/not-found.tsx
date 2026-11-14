import type { Metadata } from "next";
import EventNotFound from "@/views/EventNotFound";
import { getSite } from "@/config/site.server";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: `Evenemang hittades inte | ${site.name}`,
    robots: { index: false },
  };
}

export default function NotFound() {
  return <EventNotFound />;
}
