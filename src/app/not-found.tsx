import type { Metadata } from "next";
import NotFound from "@/views/NotFound";

export const metadata: Metadata = {
  title: "Sidan hittades inte | ivarberg.nu",
  robots: { index: false },
};

export default function NotFoundPage() {
  return <NotFound />;
}
