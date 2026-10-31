import type { Metadata } from "next";
import Tips from "@/views/Tips";

export const metadata: Metadata = {
  title: "Tipsa oss om evenemang - Varberg | ivarberg.nu",
  description:
    "Tipsa oss om evenemang i Varberg! Hjälp andra att upptäcka konserter, teater, sport och aktiviteter. Kostnadsfritt att lägga till evenemang på ivarberg.nu.",
  keywords: "tipsa evenemang Varberg, lägg till event Varberg, publicera evenemang Varberg, arrangörer Varberg",
  alternates: { canonical: "https://ivarberg.nu/tips" },
  openGraph: {
    title: "Tipsa oss om evenemang - ivarberg.nu",
    description: "Hjälp andra att upptäcka evenemang i Varberg. Kostnadsfritt att lägga till evenemang!",
    type: "website",
    url: "https://ivarberg.nu/tips",
  },
  twitter: { card: "summary", title: "Tipsa oss om evenemang - ivarberg.nu" },
};

export default function TipsPage() {
  return <Tips />;
}
