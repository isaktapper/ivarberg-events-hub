import type { Metadata } from "next";
import About from "@/views/About";

export const metadata: Metadata = {
  title: "Om oss - Evenemang i Varberg | ivarberg.nu",
  description:
    "ivarberg.nu är din kompletta guide till evenemang i Varberg. Vi samlar alla konserter, teater, sport och aktiviteter på ett ställe. Läs mer om vår vision och kontakta oss!",
  keywords: "om ivarberg, evenemang Varberg, kontakt, arrangörer Varberg, event kalender Varberg",
  alternates: { canonical: "https://ivarberg.nu/om-oss" },
  openGraph: {
    title: "Om oss - ivarberg.nu",
    description:
      "Din kompletta guide till evenemang i Varberg. Vi samlar alla konserter, teater, sport och aktiviteter på ett ställe.",
    type: "website",
    url: "https://ivarberg.nu/om-oss",
    images: ["https://ivarberg.nu/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Om oss - ivarberg.nu",
    description: "Din kompletta guide till evenemang i Varberg",
  },
};

export default function AboutPage() {
  return <About />;
}
