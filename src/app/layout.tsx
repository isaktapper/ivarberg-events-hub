import type { Metadata } from "next";
import { Providers } from "./providers";
import { SearchParamsSync } from "@/lib/router";
import { getSite } from "@/config/site.server";
import { themeCss } from "@/config/site";
import "@/index.css";

// Sidorna cachas (ISR, se revalidate i respektive page.tsx) i stället för att
// renderas vid varje besök - force-dynamic här tömde Hobby-kvoten för
// Fluid CPU i november 2026. Query-strängen läses i webbläsaren, se
// SearchParamsSync i src/lib/router.tsx.

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const icons = [
    site.theme.faviconLight && { url: site.theme.faviconLight, media: "(prefers-color-scheme: light)" },
    site.theme.faviconDark && { url: site.theme.faviconDark, media: "(prefers-color-scheme: dark)" },
  ].filter(Boolean) as { url: string; media: string }[];
  const images = site.theme.ogImage ? [{ url: site.theme.ogImage, width: 1200, height: 630 }] : undefined;

  return {
    metadataBase: new URL(site.url),
    title: site.seo.title,
    description: site.seo.description,
    keywords: site.seo.keywords,
    authors: [{ name: site.name }],
    ...(icons.length ? { icons: { icon: icons } } : {}),
    // Utkast och pausade städer ska inte synas i sökmotorer
    ...(site.indexable ? {} : { robots: { index: false, follow: false } }),
    openGraph: {
      title: site.seo.title,
      description: site.seo.description,
      type: "website",
      url: site.url,
      ...(images ? { images } : {}),
      locale: "sv_SE",
    },
    twitter: {
      card: "summary_large_image",
      title: site.seo.title,
      description: site.seo.shortDescription,
      ...(site.theme.ogImage ? { images: [site.theme.ogImage] } : {}),
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site = await getSite();
  const css = themeCss(site);
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
        {/* Stadens färger skriver över paletten i index.css (tomt för ivarberg.nu) */}
        {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      </head>
      <body className="bg-texture">
        <SearchParamsSync />
        <Providers site={site}>{children}</Providers>
      </body>
    </html>
  );
}
