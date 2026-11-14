/**
 * Stadskonfigurationen: allt som skiljer en stads sajt från en annan (namn,
 * domän, färger, logga, kontakt, vilka delar som är på).
 *
 * Samma kod körs för alla städer. Vilken stad en deploy visar styrs av
 * miljövariabeln SITE_SLUG, och värdena hämtas från tabellen `tenants`
 * (redigeras i admin under Städer). Se src/config/site.server.ts.
 *
 * Utan SITE_SLUG gäller VARBERG_SITE nedan, ordagrant som sajten såg ut innan
 * städer fanns. Ändra inte texterna här utan att tänka på SEO: de är
 * ivarberg.nu:s titlar och beskrivningar.
 *
 * Den här filen är ren (inga serveranrop) och får importeras från både server-
 * och klientkod.
 */

export interface SiteFeatures {
  /** Områdesfilter på startsidan (kräver `areas`) */
  areaFilter: boolean;
  /** Guiderna och landningssidorna /idag, /i-helgen … (texterna är stadsunika) */
  guides: boolean;
  /** Säsongssidor och säsongspuffar */
  seasons: boolean;
  /** Kategori- och områdessidor */
  taxonomyPages: boolean;
  /** Nyhetsbrevsrutan */
  newsletter: boolean;
  /** Instagram-rutan */
  instagram: boolean;
}

export interface SiteTheme {
  /** Hex-färger från admin. null = sajtens inbyggda palett (src/index.css). */
  colors: { primary: string; dark: string; accent: string; background: string; highlight: string } | null;
  /** Logga i sidhuvudet. null = sajtens namn som text. */
  logo: string | null;
  faviconLight: string | null;
  faviconDark: string | null;
  /** Bild överst på startsidan. null = enfärgad mörk yta. */
  heroImage: string | null;
  /** Delningsbild, absolut adress. null = ingen. */
  ogImage: string | null;
}

export interface SiteConfig {
  /** 'varberg' – samma som tenants.slug och SITE_SLUG */
  slug: string;
  /** tenants.id. null = SITE_SLUG är inte satt (dagens ivarberg.nu utan stadsmärkning). */
  tenantId: string | null;
  /** Sajtens namn: 'ivarberg.nu' */
  name: string;
  /** 'Varberg' */
  cityName: string;
  /** 'Varbergs' */
  cityGenitive: string;
  /** 'ivarberg.nu' */
  domain: string;
  /** 'https://ivarberg.nu' (utan avslutande snedstreck) */
  url: string;
  /**
   * Kommunkoder som eventen filtreras på. null = filtrera inte (dagens
   * ivarberg.nu, där alla event i databasen är Varbergs).
   */
  municipalityCodes: string[] | null;
  /** false = be sökmotorer att inte indexera (utkast och pausade städer) */
  indexable: boolean;
  theme: SiteTheme;
  features: SiteFeatures;
  seo: {
    /** Startsidans och standardtiteln */
    title: string;
    description: string;
    /** Kort beskrivning för delningskort */
    shortDescription: string;
    keywords: string;
    /** Rubriken överst på startsidan */
    heroHeading: string;
    /** Raden under sajtnamnet i sidfoten */
    tagline: string;
  };
  contact: {
    email: string | null;
    instagramUrl: string | null;
    instagramHandle: string | null;
    address: string | null;
  };
  /** Geografi för strukturerad data. Saknas den utelämnas fälten. */
  geo: { region: string | null; postalCode: string | null; latitude: number | null; longitude: number | null };
  /** Områden i filtret, i visningsordning. Tom lista = inget områdesfilter. */
  areas: readonly string[];
}

export const VARBERG_SLUG = "varberg";

export const VARBERG_AREAS = [
  "Centrala Varberg",
  "Getterön",
  "Apelviken",
  "Träslövsläge",
  "Tvååker",
  "Veddige",
  "Bua",
  "Övriga kommunen",
] as const;

/** ivarberg.nu, ordagrant som innan städer fanns. */
export const VARBERG_SITE: SiteConfig = {
  slug: VARBERG_SLUG,
  tenantId: null,
  name: "ivarberg.nu",
  cityName: "Varberg",
  cityGenitive: "Varbergs",
  domain: "ivarberg.nu",
  url: "https://ivarberg.nu",
  municipalityCodes: null,
  indexable: true,
  theme: {
    colors: null,
    logo: "/logo.png",
    faviconLight: "/favicon_light.png",
    faviconDark: "/favicon_dark.png",
    heroImage: "/hero_host.webp",
    ogImage: "https://ivarberg.nu/og-image.jpg",
  },
  features: { areaFilter: true, guides: true, seasons: true, taxonomyPages: true, newsletter: true, instagram: true },
  seo: {
    title: "ivarberg.nu - Vad händer i Varberg?",
    description:
      "Din kompletta guide till Varbergs evenemang. Upptäck konserter, teater, sport, restauranger och aktiviteter för hela familjen.",
    shortDescription: "Din kompletta guide till Varbergs evenemang",
    keywords: "Varberg, evenemang, event, konserter, teater, sport, restaurang, nattliv, familj, aktiviteter",
    heroHeading: "Vad händer i Varberg?",
    tagline: "Allt som händer i Varberg, på ett ställe.",
  },
  contact: {
    email: "info@ivarberg.nu",
    instagramUrl: "https://instagram.com/ivarberg.nu",
    instagramHandle: "@ivarberg.nu",
    address: "Fästningsgatan 5, 432 44 Varberg",
  },
  geo: { region: "Halland", postalCode: "432 44", latitude: 57.1057, longitude: 12.2502 },
  areas: VARBERG_AREAS,
};

/** Raden i tabellen `tenants` (bara fälten sajten läser). */
export interface TenantRow {
  id: string;
  slug: string;
  name: string;
  city_name: string;
  municipality_codes: string[] | null;
  primary_domain: string;
  status: "draft" | "live" | "paused";
  theme: {
    colors?: Partial<NonNullable<SiteTheme["colors"]>>;
    logoUrl?: string;
    faviconUrl?: string;
    faviconDarkUrl?: string;
    heroImageUrl?: string;
    ogImageUrl?: string;
  } | null;
  features: Partial<SiteFeatures> | null;
  seo: { title?: string; description?: string; heroHeading?: string } | null;
  contact: { email?: string; instagramUrl?: string; instagramHandle?: string; address?: string } | null;
}

/** "Varbergs", "Kungsbackas", men "Borås" och "Alingsås" (slutar redan på s). */
export function genitive(city: string): string {
  return /[sxz]$/i.test(city) ? city : `${city}s`;
}

const DEFAULT_COLORS = { primary: "#0F5AA6", dark: "#0B1B3A", accent: "#B84A14", background: "#F7F2EA", highlight: "#7FD1C8" };

function sameColors(a: Record<string, string>, b: Record<string, string>): boolean {
  return Object.keys(b).every((k) => (a[k] || "").toLowerCase() === b[k].toLowerCase());
}

/** Bygg en stads konfiguration från dess rad i `tenants`. Tomma fält får standardvärden utifrån stadens namn. */
export function siteFromTenant(row: TenantRow): SiteConfig {
  const isVarberg = row.slug === VARBERG_SLUG;
  const city = row.city_name;
  const cityGen = genitive(city);
  const url = `https://${row.primary_domain}`;
  const colors = { ...DEFAULT_COLORS, ...(row.theme?.colors ?? {}) };
  const features = row.features ?? {};
  const base = isVarberg ? VARBERG_SITE : null;
  // Bilder som ligger på sajten själv anges i admin som hela adresser (så att
  // förhandsvisningen där fungerar) men skrivs ut relativt, som tidigare.
  const local = (src?: string) => (src && src.startsWith(`${url}/`) ? src.slice(url.length) : src);

  return {
    slug: row.slug,
    tenantId: row.id,
    name: row.name,
    cityName: city,
    cityGenitive: cityGen,
    domain: row.primary_domain,
    url,
    municipalityCodes: row.municipality_codes?.length ? row.municipality_codes : null,
    indexable: row.status === "live",
    theme: {
      // Samma färger som den inbyggda paletten: låt index.css gälla orörd.
      colors: sameColors(colors, DEFAULT_COLORS) ? null : colors,
      logo: local(row.theme?.logoUrl) || base?.theme.logo || null,
      faviconLight: local(row.theme?.faviconUrl) || base?.theme.faviconLight || null,
      faviconDark: local(row.theme?.faviconDarkUrl) || local(row.theme?.faviconUrl) || base?.theme.faviconDark || null,
      heroImage: local(row.theme?.heroImageUrl) || base?.theme.heroImage || null,
      ogImage: row.theme?.ogImageUrl || base?.theme.ogImage || null,
    },
    features: {
      // Delar med stadsunika texter är av tills staden har eget innehåll.
      areaFilter: isVarberg ? features.areaFilter ?? true : false,
      guides: isVarberg ? features.guides ?? true : false,
      seasons: isVarberg ? features.seasons ?? true : false,
      taxonomyPages: isVarberg ? features.taxonomyPages ?? true : false,
      newsletter: features.newsletter ?? isVarberg,
      instagram: (features.instagram ?? isVarberg) && !!(row.contact?.instagramUrl || base?.contact.instagramUrl),
    },
    seo: {
      title: row.seo?.title || base?.seo.title || `${row.name} - Vad händer i ${city}?`,
      description:
        row.seo?.description ||
        base?.seo.description ||
        `Din kompletta guide till ${cityGen} evenemang. Upptäck konserter, teater, sport, restauranger och aktiviteter för hela familjen.`,
      shortDescription: base?.seo.shortDescription || `Din kompletta guide till ${cityGen} evenemang`,
      keywords: base?.seo.keywords || `${city}, evenemang, event, konserter, teater, sport, restaurang, nattliv, familj, aktiviteter`,
      heroHeading: row.seo?.heroHeading || base?.seo.heroHeading || `Vad händer i ${city}?`,
      tagline: base?.seo.tagline || `Allt som händer i ${city}, på ett ställe.`,
    },
    contact: {
      email: row.contact?.email || base?.contact.email || null,
      instagramUrl: row.contact?.instagramUrl || base?.contact.instagramUrl || null,
      instagramHandle: row.contact?.instagramHandle || base?.contact.instagramHandle || null,
      address: row.contact?.address || base?.contact.address || null,
    },
    geo: base?.geo ?? { region: null, postalCode: null, latitude: null, longitude: null },
    areas: isVarberg ? VARBERG_AREAS : [],
  };
}

// ---------- Tema ----------

function hexToHsl(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const r = parseInt(m[1].slice(0, 2), 16) / 255;
  const g = parseInt(m[1].slice(2, 4), 16) / 255;
  const b = parseInt(m[1].slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)];
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const hsl = (h: number, s: number, l: number) => `${h} ${clamp(s, 0, 100)}% ${clamp(l, 0, 100)}%`;

/**
 * CSS som skriver över paletten i src/index.css med stadens färger. Nyanserna
 * (hover, ljusa ytor) räknas fram ur de fem färgerna, med samma steg som i
 * ivarberg.nu:s palett. Tom sträng = använd den inbyggda paletten.
 */
export function themeCss(site: SiteConfig): string {
  const c = site.theme.colors;
  if (!c) return "";
  // Bara färger som skiljer sig från den inbyggda paletten skrivs över, så att
  // index.css exakta nyanser gäller för resten (omräkning hex → hsl är inte exakt).
  const changed = (key: keyof typeof DEFAULT_COLORS) =>
    c[key].toLowerCase() === DEFAULT_COLORS[key].toLowerCase() ? null : hexToHsl(c[key]);
  const primary = changed("primary");
  const dark = changed("dark");
  const accent = changed("accent");
  const background = changed("background");
  const highlight = changed("highlight");
  const vars: string[] = [];

  if (primary) {
    const [h, s, l] = primary;
    vars.push(
      `--sea:${hsl(h, s, l)}`,
      `--sea-dark:${hsl(h, s, l - 6)}`,
      `--sea-light:${hsl(h, Math.min(s, 63), 92)}`,
      `--sea-lightest:${hsl(h, Math.min(s, 67), 96)}`,
      `--sea-mist:${hsl(h, Math.min(s, 81), 79)}`,
      `--ocean-deep:${hsl(h, s, l)}`,
      `--ocean-light:${hsl(h, s, l + 21)}`,
    );
  }
  if (dark) {
    const [h, s, l] = dark;
    vars.push(`--navy-zone:${hsl(h, s, l)}`, `--dark-navy:${hsl(h, s, l)}`, `--dark-navy-light:${hsl(h, s, l + 11)}`, `--ink:${hsl(h, s, clamp(l + 4, 0, 24))}`);
  }
  if (accent) {
    const [h, s, l] = accent;
    vars.push(`--poppy:${hsl(h, s, l)}`, `--poppy-light:${hsl(h, s, 91)}`);
  }
  if (background) {
    const [h, s, l] = background;
    vars.push(`--sand:${hsl(h, s, l)}`, `--sand-deep:${hsl(h, s, l - 7)}`, `--sandy-beige:${hsl(h, s, l)}`, `--sandy-light:${hsl(h, s, l + 1)}`);
  }
  if (highlight) {
    const [h, s, l] = highlight;
    vars.push(`--seaglass:${hsl(h, s, l)}`);
  }
  return vars.length ? `:root{${vars.join(";")}}` : "";
}

/** Absolut adress till en sökväg på sajten: abs(site, '/tips') → 'https://ivarberg.nu/tips' */
export function abs(site: Pick<SiteConfig, "url">, path = ""): string {
  return `${site.url}${path}`;
}
