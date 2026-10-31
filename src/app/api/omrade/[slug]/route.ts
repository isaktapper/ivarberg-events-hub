import handler from "../../../../../legacy-api/omrade";
import { adaptLegacyHandler } from "@/lib/legacy/vercel-adapter";

export const dynamic = "force-dynamic";
// /omrade/<slug> → samma hanterare som /api/omrade?slug=<slug>
export const GET = adaptLegacyHandler(handler, "slug");
