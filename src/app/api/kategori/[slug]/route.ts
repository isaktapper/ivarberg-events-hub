import handler from "../../../../../legacy-api/kategori";
import { adaptLegacyHandler } from "@/lib/legacy/vercel-adapter";
import { requireFeature } from "@/lib/legacy/feature-gate";

export const dynamic = "force-dynamic";
// /kategori/<slug> → samma hanterare som /api/kategori?slug=<slug>
export const GET = requireFeature("taxonomyPages", adaptLegacyHandler(handler, "slug"));
