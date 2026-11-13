// Delade typer och hjälpfunktioner för tipsflödet (länk eller bild → granska → skicka).

export const TIP_CATEGORIES = [
  "Scen",
  "Nattliv",
  "Sport",
  "Barn & Familj",
  "Mat & Dryck",
  "Utställningar",
  "Föreläsningar",
  "Marknader",
  "Film & bio",
  "Djur & Natur",
  "Guidade visningar",
  "Jul",
] as const;

export type TipDraft = {
  name: string;
  date: string; // YYYY-MM-DD eller ""
  time: string; // HH:MM eller ""
  location: string;
  price: string;
  categories: string[];
  description: string;
  image_url: string;
  url: string;
};

export type TipField = "name" | "when" | "location" | "price" | "categories" | "description";

export const emptyDraft = (overrides: Partial<TipDraft> = {}): TipDraft => ({
  name: "",
  date: "",
  time: "",
  location: "",
  price: "",
  categories: [],
  description: "",
  image_url: "",
  url: "",
  ...overrides,
});

/** Fält som måste finnas för att tipset ska kunna skickas in. */
export function missingFields(draft: TipDraft): TipField[] {
  const missing: TipField[] = [];
  if (draft.name.trim().length < 3) missing.push("name");
  if (!draft.date) missing.push("when");
  if (draft.location.trim().length < 3) missing.push("location");
  return missing;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "Lördag 21 november kl 18.00" (eller kortformen "Lör 21 nov kl 18.00"). */
export function formatWhen(draft: Pick<TipDraft, "date" | "time">, short = false): string {
  if (!draft.date) return "";
  const date = new Date(`${draft.date}T12:00:00`);
  if (isNaN(date.getTime())) return "";
  const sameYear = date.getFullYear() === new Date().getFullYear();
  const text = new Intl.DateTimeFormat("sv-SE", {
    weekday: short ? "short" : "long",
    day: "numeric",
    month: short ? "short" : "long",
    ...(sameYear ? {} : { year: "numeric" }),
  })
    .format(date)
    .replace(/\./g, "");
  return capitalize(text) + (draft.time ? ` kl ${draft.time.replace(":", ".")}` : "");
}

export function normalizeUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function isSocialLink(raw: string): boolean {
  try {
    const host = new URL(normalizeUrl(raw)).hostname.toLowerCase();
    return /(^|\.)(facebook\.com|fb\.me|fb\.com|fb\.watch|instagram\.com)$/.test(host);
  } catch {
    return false;
  }
}

export function linkHost(raw: string): string {
  try {
    return new URL(normalizeUrl(raw)).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export type ExtractResult =
  | { ok: true; events: TipDraft[]; source: string }
  | { ok: false; reason: string };

export async function extractTip(input: { url?: string; image_url?: string }, signal?: AbortSignal): Promise<ExtractResult> {
  try {
    const response = await fetch("/api/tips/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal,
    });
    const result = await response.json();
    if (result.success && Array.isArray(result.events) && result.events.length > 0) {
      return { ok: true, events: result.events.map((event: Partial<TipDraft>) => emptyDraft(event)), source: result.source };
    }
    return { ok: false, reason: result.reason || "error" };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return { ok: false, reason: "aborted" };
    return { ok: false, reason: "network_error" };
  }
}

export async function submitTip(draft: TipDraft): Promise<{ success: boolean; tip_id?: number; error?: string }> {
  // Tipstabellen har inget prisfält, så priset följer med i beskrivningen
  const description = [draft.description.trim(), draft.price.trim() && `Pris: ${draft.price.trim()}`].filter(Boolean).join("\n\n");
  let websiteUrl = "";
  try {
    websiteUrl = draft.url ? new URL(normalizeUrl(draft.url)).href : "";
  } catch {
    // ogiltig länk skickas inte med
  }

  try {
    const response = await fetch("/api/submit-event-tip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: draft.name.trim(),
        date_time: `${draft.date}T${draft.time || "00:00"}`,
        event_location: draft.location.trim(),
        venue_name: draft.location.trim(),
        description: description || undefined,
        categories: draft.categories,
        image_url: draft.image_url || undefined,
        website_url: websiteUrl || undefined,
      }),
    });
    const result = await response.json();
    if (response.ok && result.success) return { success: true, tip_id: result.tip_id };
    return { success: false, error: result.error || "Det gick inte att skicka in tipset. Försök igen." };
  } catch {
    return { success: false, error: "Det gick inte att skicka in tipset. Försök igen." };
  }
}

export async function saveNotifyEmail(tipIds: number[], email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/tips/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tip_ids: tipIds, email }),
    });
    const result = await response.json();
    return result.success ? { success: true } : { success: false, error: result.error || "Det gick inte att spara just nu." };
  } catch {
    return { success: false, error: "Det gick inte att spara just nu." };
  }
}
