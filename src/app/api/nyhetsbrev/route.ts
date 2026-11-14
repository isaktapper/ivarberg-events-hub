// Nyhetsbrevsanmälan från de serverrenderade sidorna (t.ex. /jul-i-varberg).
// Samma tabell och regler som subscribeToNewsletter() i eventService (footern).
//
// JSON in → JSON ut (formulärets fetch). Vanlig formulärpost (utan JS) →
// 303 tillbaka till sidan med ?nyhetsbrev=<status>#nyhetsbrev.

import { getSite, tenantFields } from "@/config/site.server";

export const dynamic = "force-dynamic";

type Status = "ok" | "finns" | "ogiltig" | "fel";

const MESSAGES: Record<Status, string> = {
  ok: "Tack! Nu är du anmäld till nyhetsbrevet.",
  finns: "Den e-postadressen är redan anmäld.",
  ogiltig: "Fyll i en giltig e-postadress.",
  fel: "Något gick fel. Försök igen om en stund.",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function subscribe(namn: string, epost: string): Promise<Status> {
  const name = namn.trim();
  const email = epost.trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254 || name.length > 100) return "ogiltig";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return "fel";

  const res = await fetch(`${url}/rest/v1/newsletter_subscriptions`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ email, name, ...tenantFields(await getSite()) }),
  });
  if (res.ok) return "ok";
  if (res.status === 409) return "finns"; // unique-constraint på email
  console.error(`Newsletter insert failed: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  return "fel";
}

// Bara interna sökvägar som mål för omdirigeringen
function safePath(value: unknown): string {
  const s = typeof value === "string" ? value : "";
  return s.startsWith("/") && !s.startsWith("//") ? s.split(/[?#]/)[0] : "/";
}

export async function POST(request: Request): Promise<Response> {
  const isJson = (request.headers.get("content-type") || "").includes("application/json");
  let namn = "";
  let epost = "";
  let honeypot = "";
  let back = "/";

  try {
    if (isJson) {
      const body = (await request.json()) as Record<string, unknown>;
      namn = String(body.namn ?? "");
      epost = String(body.epost ?? "");
      honeypot = String(body.website ?? "");
    } else {
      const form = await request.formData();
      namn = String(form.get("namn") ?? "");
      epost = String(form.get("epost") ?? "");
      honeypot = String(form.get("website") ?? "");
      back = safePath(form.get("tillbaka"));
    }
  } catch {
    namn = "";
  }

  // Botar fyller i det dolda fältet – svara som om allt gick bra
  const status: Status = honeypot ? "ok" : await subscribe(namn, epost).catch(() => "fel" as const);

  if (isJson) {
    return Response.json({ ok: status === "ok", message: MESSAGES[status] }, { status: status === "fel" ? 500 : 200 });
  }
  return new Response(null, {
    status: 303,
    headers: { Location: `${back}?nyhetsbrev=${status}#nyhetsbrev` },
  });
}
