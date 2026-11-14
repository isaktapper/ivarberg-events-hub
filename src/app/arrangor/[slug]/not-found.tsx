import type { Metadata } from "next";
import OrganizerNotFound from "@/views/OrganizerNotFound";
import { getSite } from "@/config/site.server";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: `Arrangör hittades inte | ${site.name}`,
    robots: { index: false },
  };
}

export default function NotFound() {
  return <OrganizerNotFound />;
}
