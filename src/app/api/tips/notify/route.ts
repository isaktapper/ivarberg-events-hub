/**
 * POST /api/tips/notify  { tip_ids: number[], email }
 *
 * Tack-skärmens "Vill du veta när det är publicerat?": lägger till tipsarens
 * e-post på tips som just skickats in. Bara tips utan e-post som skapats den
 * senaste timmen kan uppdateras, så att ingen kan skriva över andras tips.
 *
 * Env: SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_URL
 */

export const dynamic = "force-dynamic";

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
  if (!allow(ip)) return fail("För många försök. Vänta några minuter och försök igen.", 429);

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("tips/notify: VITE_SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY saknas");
    return fail("Det gick inte att spara just nu.", 500);
  }

  let body: { tip_ids?: unknown; email?: unknown } = {};
  try {
    body = (await request.json()) ?? {};
  } catch {
    // hanteras nedan
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail("Kontrollera e-postadressen.", 400);
  }

  const ids = Array.isArray(body.tip_ids) ? body.tip_ids.filter((id): id is number => Number.isInteger(id) && (id as number) > 0).slice(0, 10) : [];
  if (ids.length === 0) return fail("Det gick inte att spara just nu.", 400);

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const query = `id=in.(${ids.join(",")})&submitter_email=is.null&created_at=gte.${encodeURIComponent(since)}`;
  const response = await fetch(`${supabaseUrl}/rest/v1/event_tips?${query}`, {
    method: "PATCH",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ submitter_email: email }),
  });

  if (!response.ok) {
    console.error("tips/notify: Supabase svarade", response.status, (await response.text()).slice(0, 300));
    return fail("Det gick inte att spara just nu.", 502);
  }

  return Response.json({ success: true });
}
