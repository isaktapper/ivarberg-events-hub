import type { Metadata } from "next";
import NotFound from "@/views/NotFound";
import { getSite } from "@/config/site.server";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: `Sidan hittades inte | ${site.name}`,
    robots: { index: false },
  };
}

export default function NotFoundPage() {
  return <NotFound />;
}
