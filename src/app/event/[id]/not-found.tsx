import type { Metadata } from "next";
import EventNotFound from "@/views/EventNotFound";

export const metadata: Metadata = {
  title: "Evenemang hittades inte | ivarberg.nu",
  robots: { index: false },
};

export default function NotFound() {
  return <EventNotFound />;
}
