/**
 * POST /api/tips/upload-image  (multipart/form-data { file })  →  { success, url }
 *
 * Tar emot en bild från tipsflödet (affisch, skärmbild eller eventfoto),
 * kodar om den till en ren JPEG och lägger den i Supabase Storage,
 * bucket event-images under tips/. Samma bucket som admin använder.
 *
 * Omkodningen gör tre saker: säkerställer att filen verkligen är en bild,
 * håller nere storleken och tar bort metadata (t.ex. GPS-position från mobilen).
 *
 * Env: SUPABASE_SERVICE_ROLE_KEY (krävs, bara på servern), VITE_SUPABASE_URL
 */
import sharp from "sharp";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const BUCKET = "event-images";
const FOLDER = "tips";
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_DIMENSION = 1600;

// Enkel rate limit per serverinstans; byts mot något delat innan detta går live.
const rateLimit = new Map<string, { count: number; resetTime: number }>();
function allow(identifier: string, max = 10, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const record = rateLimit.get(identifier);
  if (!record || now > record.resetTime) {
    rateLimit.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= max) return false;
  record.count++;
  return true;
}

function fail(error: string, status: number) {
  return Response.json({ success: false, error }, { status });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  if (!allow(ip)) return fail("För många uppladdningar. Vänta några minuter och försök igen.", 429);

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("tips/upload-image: VITE_SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY saknas");
    return fail("Bilduppladdning är inte påslagen just nu.", 500);
  }

  let file: File;
  try {
    const form = await request.formData();
    const entry = form.get("file");
    if (!(entry instanceof File)) return fail("Ingen bild skickades.", 400);
    file = entry;
  } catch {
    return fail("Ingen bild skickades.", 400);
  }
  if (file.size === 0) return fail("Bilden är tom.", 400);
  if (file.size > MAX_UPLOAD_BYTES) return fail("Bilden är för stor. Välj en mindre bild.", 413);

  let jpeg: Buffer;
  try {
    jpeg = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 50_000_000 })
      .rotate() // vrid enligt EXIF innan metadatan tas bort
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
  } catch {
    return fail("Vi kunde inte läsa bilden. Prova en annan bild.", 400);
  }

  const path = `${FOLDER}/${new Date().toISOString().slice(0, 10)}-${randomUUID()}.jpg`;
  const upload = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000",
      "x-upsert": "false",
    },
    body: new Uint8Array(jpeg),
  });

  if (!upload.ok) {
    console.error("tips/upload-image: Supabase svarade", upload.status, (await upload.text()).slice(0, 300));
    return fail("Uppladdningen misslyckades. Försök igen.", 502);
  }

  return Response.json({
    success: true,
    url: `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`,
    path,
  });
}
