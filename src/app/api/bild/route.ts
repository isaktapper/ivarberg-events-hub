import sharp from "sharp";
import { supabase } from "@/lib/supabase";
import { IMAGE_WIDTHS, fromBase64Url, type ImageWidth } from "@/lib/images";

// Skalar ner en eventbild och gör om den till WebP. Svaret cachas i Vercels
// CDN, så varje bild och bredd räknas bara om en gång. Se src/lib/images.ts.

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_SOURCE_BYTES = 30 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15_000;

// Bara bilder som hör till ett event får hämtas, så att tjänsten inte kan
// användas som öppen proxy. Kontrollen görs bara vid cachemiss.
async function isEventImage(url: string): Promise<boolean> {
  const { data, error } = await supabase.from("events").select("id").eq("image_url", url).limit(1);
  return !error && !!data && data.length > 0;
}

// Går något fel visas originalbilden, precis som innan bildtjänsten fanns
function fallback(url: string) {
  return new Response(null, {
    status: 302,
    headers: { Location: url, "Cache-Control": "public, max-age=300, s-maxage=300" },
  });
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  let url = "";
  try {
    url = fromBase64Url(params.get("src") ?? "");
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const width = Number(params.get("w")) as ImageWidth;

  if (!/^https?:\/\//i.test(url) || !IMAGE_WIDTHS.includes(width)) {
    return new Response("Bad request", { status: 400 });
  }
  if (!(await isEventImage(url))) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const source = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
      },
    });
    if (!source.ok) return fallback(url);

    const length = Number(source.headers.get("content-length") ?? 0);
    if (length > MAX_SOURCE_BYTES) return fallback(url);

    const input = Buffer.from(await source.arrayBuffer());
    if (input.byteLength > MAX_SOURCE_BYTES) return fallback(url);

    const output = await sharp(input, { failOn: "none", limitInputPixels: 100_000_000 })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();

    return new Response(new Uint8Array(output), {
      headers: {
        "Content-Type": "image/webp",
        // Webbläsaren: en vecka. CDN: ett år (samma URL = samma bild).
        "Cache-Control": "public, max-age=604800, s-maxage=31536000, stale-while-revalidate=86400",
      },
    });
  } catch {
    return fallback(url);
  }
}
