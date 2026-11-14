"use client";

import { createContext, useContext, type ReactNode } from "react";
import { VARBERG_SITE, type SiteConfig } from "./site";

const SiteContext = createContext<SiteConfig>(VARBERG_SITE);

/** Gör stadskonfigurationen tillgänglig för klientkomponenter. Sätts i src/app/layout.tsx. */
export function SiteProvider({ site, children }: { site: SiteConfig; children: ReactNode }) {
  return <SiteContext.Provider value={site}>{children}</SiteContext.Provider>;
}

/** Stadens namn, domän, kontakt och påslagna delar. */
export function useSite(): SiteConfig {
  return useContext(SiteContext);
}
