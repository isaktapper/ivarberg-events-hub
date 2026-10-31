// Körs en gång när serverinstansen startar (även på Vercel, där next.config
// inte körs vid runtime). Se kommentaren om tidszon i next.config.ts.
export function register() {
  process.env.TZ = "Europe/Stockholm";
}
