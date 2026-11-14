// Tar emot svar från "Tyck till"-rutan och sparar dem i tabellen site_feedback.

import { getSite, tenantFields } from "@/config/site.server";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, message: "Något gick fel. Försök igen om en stund." }, { status: 400 });
  }

  // Botar fyller i det dolda fältet – svara som om allt gick bra
  if (body.website) return Response.json({ ok: true });

  const verdict = body.verdict === "gillar" || body.verdict === "gillar_inte" ? body.verdict : null;
  const comment = String(body.comment ?? "").trim().slice(0, 2000);
  const email = String(body.email ?? "").trim().toLowerCase();
  const page = String(body.page ?? "").slice(0, 200);

  if (!verdict) {
    return Response.json({ ok: false, message: "Välj om du gillar det eller inte." }, { status: 400 });
  }
  if (email && (!EMAIL.test(email) || email.length > 254)) {
    return Response.json({ ok: false, message: "E-postadressen ser inte rätt ut." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return Response.json({ ok: false, message: "Något gick fel. Försök igen om en stund." }, { status: 500 });
  }

  const res = await fetch(`${url}/rest/v1/site_feedback`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ verdict, comment: comment || null, email: email || null, page: page || null, ...tenantFields(await getSite()) }),
  });
  if (res.ok) return Response.json({ ok: true });

  console.error(`Feedback insert failed: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  return Response.json({ ok: false, message: "Något gick fel. Försök igen om en stund." }, { status: 500 });
}
