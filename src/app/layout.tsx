import type { Metadata } from "next";
import { Providers } from "./providers";
import { SearchParamsSync } from "@/lib/router";
import "@/index.css";

// Sidorna cachas (ISR, se revalidate i respektive page.tsx) i stället för att
// renderas vid varje besök - force-dynamic här tömde Hobby-kvoten för
// Fluid CPU i november 2026. Query-strängen läses i webbläsaren, se
// SearchParamsSync i src/lib/router.tsx.

const DESCRIPTION =
  "Din kompletta guide till Varbergs evenemang. Upptäck konserter, teater, sport, restauranger och aktiviteter för hela familjen.";

export const metadata: Metadata = {
  metadataBase: new URL("https://ivarberg.nu"),
  title: "ivarberg.nu - Vad händer i Varberg?",
  description: DESCRIPTION,
  keywords: "Varberg, evenemang, event, konserter, teater, sport, restaurang, nattliv, familj, aktiviteter",
  authors: [{ name: "ivarberg.nu" }],
  icons: {
    icon: [
      { url: "/favicon_light.png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon_dark.png", media: "(prefers-color-scheme: dark)" },
    ],
  },
  openGraph: {
    title: "ivarberg.nu - Vad händer i Varberg?",
    description: DESCRIPTION,
    type: "website",
    url: "https://ivarberg.nu",
    images: [{ url: "https://ivarberg.nu/og-image.jpg", width: 1200, height: 630 }],
    locale: "sv_SE",
  },
  twitter: {
    card: "summary_large_image",
    title: "ivarberg.nu - Vad händer i Varberg?",
    description: "Din kompletta guide till Varbergs evenemang",
    images: ["https://ivarberg.nu/og-image.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <head>
        {/* Samma typsnittsladdning som index.html i Vite-versionen */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-texture">
        <SearchParamsSync />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
