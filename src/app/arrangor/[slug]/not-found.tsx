import type { Metadata } from "next";
import OrganizerNotFound from "@/views/OrganizerNotFound";

export const metadata: Metadata = {
  title: "Arrangör hittades inte | ivarberg.nu",
  robots: { index: false },
};

export default function NotFound() {
  return <OrganizerNotFound />;
}
