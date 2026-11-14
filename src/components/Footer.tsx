"use client";

import { useEffect } from "react";
import { NewsletterCard } from "@/components/NewsletterCard";
import { useSite } from "@/config/SiteProvider";
import type { SiteConfig } from "@/config/site";
import {
  FOOTER_BOTTOM_LINKS,
  FOOTER_GROUPS,
  type FooterLink,
  INU_LABEL,
  INU_LIME,
  INU_PATH,
  INU_URL,
} from "../../legacy-api/_lib/footer";
import { SEASONS } from "../../legacy-api/_lib/seasons";

// Länkarna i legacy-api/_lib/footer.ts är Varbergs sidor. En länk visas bara
// om delen den hör till är påslagen för staden (annars svarar sidan 404).
const GUIDE_HREFS = new Set(["/idag", "/i-helgen", "/i-veckan", "/varberg-kalender", "/evenemang-varberg", "/att-gora-i-varberg"]);
const SEASON_HREFS = new Set(SEASONS.map((s) => `/${s.slug}`));

function linkEnabled(href: string, features: SiteConfig["features"]): boolean {
  if (GUIDE_HREFS.has(href)) return features.guides;
  if (SEASON_HREFS.has(href)) return features.seasons;
  if (href.startsWith("/kategori/") || href.startsWith("/omrade/")) return features.taxonomyPages;
  return true;
}

export function Footer() {
  const site = useSite();
  const groups = FOOTER_GROUPS.map((group) => ({
    ...group,
    links: group.links.filter((link) => linkEnabled(link.href, site.features)),
  })).filter((group) => group.links.length > 0);
  // Kontaktlänkarna kommer från stadens uppgifter och utelämnas om de saknas
  const bottomLinks = FOOTER_BOTTOM_LINKS.flatMap((link): FooterLink[] => {
    if (link.href.startsWith("mailto:")) {
      return site.contact.email ? [{ href: `mailto:${site.contact.email}`, label: site.contact.email }] : [];
    }
    if (link.label === "Instagram") {
      return site.contact.instagramUrl ? [{ ...link, href: site.contact.instagramUrl }] : [];
    }
    return [link];
  });
  // Serverrenderade sidor länkar hit med ?nyhetsbrev=1 – hoppa till anmälan i sidfoten
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("nyhetsbrev") !== "1") return;
    params.delete("nyhetsbrev");
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
    setTimeout(() => {
      document.getElementById("nyhetsbrev")?.scrollIntoView({ block: "center" });
      document.getElementById("sidfot-epost")?.focus({ preventScroll: true });
    }, 300);
  }, []);

  const linkClass = "inline-block py-1.5 text-sand/75 hover:text-seaglass transition-colors";

  return (
    <footer className="mt-16 bg-navy text-sand">
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-7 lg:px-6 lg:pt-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,3fr)] lg:gap-14">
          <div>
            <p className="text-xl font-bold text-white tracking-tight mb-1.5">{site.name}</p>
            <p className="text-[15px] text-sand/75">{site.seo.tagline}</p>
            {site.contact.address && <p className="mt-3 text-sm text-sand/75">{site.contact.address}</p>}
            <NewsletterCard variant="dark" source="footer" inputId="sidfot-epost" />
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
            {groups.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <h2 className="mb-2 text-sm font-semibold text-white">{group.title}</h2>
                <ul className="text-sm">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} className={linkClass}>
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-sand/15 pt-5 text-sm text-sand/75">
          <ul className="flex flex-wrap items-center gap-x-5">
            <li>&copy; {new Date().getFullYear()}{` ${site.name}`}</li>
            {bottomLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className={linkClass}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={INU_URL}
            rel="noopener"
            aria-label={INU_LABEL}
            className="inline-flex items-center gap-1.5 py-1.5 font-medium text-white hover:text-seaglass transition-colors"
          >
            En del av
            <svg viewBox="0 7 147 85" width="26" height="15" aria-hidden="true" focusable="false" className="block">
              <path d={INU_PATH} fill="none" stroke="currentColor" strokeWidth="13" />
              <rect x="0" y="9" width="13" height="13" fill={INU_LIME} />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}