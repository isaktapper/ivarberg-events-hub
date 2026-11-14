/**
 * Hämtar stadskonfigurationen på servern. Se src/config/site.ts.
 *
 * - SITE_SLUG inte satt: ivarberg.nu precis som innan städer fanns. Ingen
 *   databasfråga, ingen filtrering.
 * - SITE_SLUG satt: stadens rad i `tenants` läses (cachad 5 min) och eventen
 *   filtreras på stadens kommunkoder.
 */

import { unstable_cache } from "next/cache";
import { VARBERG_SITE, VARBERG_SLUG, siteFromTenant, type SiteConfig, type TenantRow } from "./site";

const SITE_SLUG = (process.env.SITE_SLUG || "").trim().toLowerCase();

async function loadTenant(slug: string): Promise<TenantRow | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error("Supabase-uppgifter saknas");

  const res = await fetch(
    `${supabaseUrl}/rest/v1/tenants?slug=eq.${encodeURIComponent(slug)}&select=id,slug,name,city_name,municipality_codes,primary_domain,status,theme,features,seo,contact&limit=1`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }, cache: "no-store" },
  );
  // Kastar så att ett fel aldrig cachas (unstable_cache sparar bara lyckade svar)
  if (!res.ok) throw new Error(`Kunde inte hämta staden "${slug}": HTTP ${res.status}`);
  const rows = (await res.json()) as TenantRow[];
  return rows[0] ?? null;
}

const getTenant = unstable_cache(loadTenant, ["site-tenant-v1"], { revalidate: 300, tags: ["site"] });

export async function getSite(): Promise<SiteConfig> {
  if (!SITE_SLUG) return VARBERG_SITE;

  // Lokal förhandsvisning av en stad som inte finns i databasen än:
  // SITE_PREVIEW_JSON='{"id":"…","slug":"demo","name":"idemo.nu",…}' npm run dev
  if (process.env.NODE_ENV === "development" && process.env.SITE_PREVIEW_JSON) {
    return siteFromTenant(JSON.parse(process.env.SITE_PREVIEW_JSON) as TenantRow);
  }

  try {
    const row = await getTenant(SITE_SLUG);
    if (row) return siteFromTenant(row);
    if (SITE_SLUG !== VARBERG_SLUG) throw new Error(`Staden "${SITE_SLUG}" finns inte i tabellen tenants (kontrollera SITE_SLUG)`);
  } catch (error) {
    // En annan stad får aldrig visa Varbergs sajt av misstag: hellre ett fel.
    if (SITE_SLUG !== VARBERG_SLUG) throw error;
    console.error("Kunde inte hämta Varbergs rad i tenants, använder de inbyggda värdena:", error);
  }
  return VARBERG_SITE;
}

/** PostgREST-filter för stadens event, t.ex. "&municipality_code=in.(1383)". Tom sträng = filtrera inte. */
export function municipalityQuery(site: SiteConfig): string {
  return site.municipalityCodes ? `&municipality_code=in.(${site.municipalityCodes.map(encodeURIComponent).join(",")})` : "";
}

/** Fält att lägga på nya rader (tips, nyhetsbrev, synpunkter) så att de hamnar på rätt stad. */
export function tenantFields(site: SiteConfig): { tenant_id?: string } {
  return site.tenantId ? { tenant_id: site.tenantId } : {};
}
