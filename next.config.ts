import type { NextConfig } from "next";

// Servern ska räkna datum i svensk tid, precis som besökarnas webbläsare.
// Eventtider lagras som lokal tid utan tidszon, och dateUtils/eventService
// använder lokala Date-metoder - på Vercel (UTC) skulle "kl 19" annars bli "kl 21".
process.env.TZ = "Europe/Stockholm";

// Vercel-projektet har sina env-variabler med Vite-prefix. De mappas här till
// Next-namn så att inget behöver ändras i Vercel.
const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "",
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? process.env.VITE_PUBLIC_POSTHOG_KEY ?? "",
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? process.env.VITE_PUBLIC_POSTHOG_HOST ?? "",
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? process.env.VITE_GOOGLE_MAPS_API_KEY ?? "",
};

// sharp (bildtjänsten /api/bild) laddar sina Linux-binärer dynamiskt och
// spåras inte av Next - utan detta ERR_DLOPEN_FAILED (libvips saknas) på
// Vercel. Globbarna måste peka på de riktiga paketkatalogerna i .pnpm, inte
// pnpm:s symlänkar (samma lösning som i ivarberg_admin).
const SHARP_LINUX_FILES = [
  "./node_modules/.pnpm/sharp@*/node_modules/sharp/**",
  "./node_modules/.pnpm/@img+sharp-linux-x64@*/node_modules/@img/sharp-linux-x64/**",
  "./node_modules/.pnpm/@img+sharp-libvips-linux-x64@*/node_modules/@img/sharp-libvips-linux-x64/**",
];

const nextConfig: NextConfig = {
  env,
  serverExternalPackages: ["sharp"],
  outputFileTracingIncludes: {
    "/api/bild": SHARP_LINUX_FILES,
  },
  turbopack: { root: process.cwd() },
  async rewrites() {
    // Serverrenderade landningssidor (tidigare rewrites i vercel.json → api/*)
    return [
      { source: "/idag", destination: "/api/landing/idag" },
      { source: "/imorgon", destination: "/api/landing/imorgon" },
      { source: "/i-helgen", destination: "/api/landing/i-helgen" },
      { source: "/i-veckan", destination: "/api/landing/i-veckan" },
      { source: "/evenemang-varberg", destination: "/api/guide/evenemang-varberg" },
      { source: "/att-gora-i-varberg", destination: "/api/guide/att-gora-i-varberg" },
      { source: "/varberg-kalender", destination: "/api/guide/varberg-kalender" },
      { source: "/kategori/:slug", destination: "/api/kategori/:slug" },
      { source: "/omrade/:slug", destination: "/api/omrade/:slug" },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
