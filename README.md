# ivarberg.nu – publika sajten

Next.js 16 (App Router) med serverrendering. Data från Supabase.

## Struktur

- `src/app/` – routes. Varje sida hämtar sin data på servern och skickar den till vyn.
- `src/views/` – sidvyerna (klientkomponenter, tidigare `src/pages` i Vite-versionen).
- `src/components/` – UI-komponenter.
- `src/lib/router.tsx` – samma API som react-router-dom (`Link to=`, `useSearchParams` …) ovanpå Next-routern.
- `src/lib/helmet.tsx` – ersätter react-helmet: JSON-LD renderas i HTML:en, titel uppdateras vid filterbyte. Grundmetadata sätts med `generateMetadata` i `src/app`.
- `src/lib/server-data.ts` – datahämtning för serverrenderingen.
- `legacy-api/` – de serverrenderade landningssidorna (`/idag`, `/kategori/*`, guiderna), sitemap och tips-API. Körs oförändrade via route handlers i `src/app/api/*` (se `src/lib/legacy/vercel-adapter.ts`) och rewrites i `next.config.ts`.

## Tidszon

Eventtider lagras som lokal tid utan tidszon. Servern sätts till `Europe/Stockholm`
(`src/instrumentation.ts`, `next.config.ts`) så att tider och "Idag" blir samma som i webbläsaren.

## Utveckling

```bash
pnpm install
vercel env pull .env.local
pnpm dev
```

Env-variablerna i Vercel heter `VITE_*`; `next.config.ts` mappar dem till `NEXT_PUBLIC_*`.
