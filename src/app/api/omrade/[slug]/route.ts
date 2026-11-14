import handler from "../../../../../legacy-api/omrade";
import { adaptLegacyHandler } from "@/lib/legacy/vercel-adapter";
import { requireFeature } from "@/lib/legacy/feature-gate";

export const dynamic = "force-dynamic";
// /omrade/<slug> → samma hanterare som /api/omrade?slug=<slug>
export const GET = requireFeature("taxonomyPages", adaptLegacyHandler(handler, "slug"));
