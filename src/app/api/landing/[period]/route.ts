import handler from "../../../../../legacy-api/landing";
import { adaptLegacyHandler } from "@/lib/legacy/vercel-adapter";

export const dynamic = "force-dynamic";
// /landing/<period> → samma hanterare som /api/landing?period=<period>
export const GET = adaptLegacyHandler(handler, "period");
