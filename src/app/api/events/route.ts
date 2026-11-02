import { NextResponse } from "next/server";
import { getUpcomingEventRows } from "@/lib/server-data";

export const dynamic = "force-dynamic";

// Kommande event (bara listfälten) för sökrutan i headern. Samma cachade
// hämtning som serverrenderingen använder, och svaret cachas även i CDN:en.
export async function GET() {
  try {
    const events = await getUpcomingEventRows();
    return NextResponse.json(
      { events },
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=3600" } }
    );
  } catch (error) {
    console.error("Error in /api/events:", error);
    return NextResponse.json({ error: "Kunde inte hämta event" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
