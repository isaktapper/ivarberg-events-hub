import handler from "../../../../../legacy-api/guide";
import { adaptLegacyHandler } from "@/lib/legacy/vercel-adapter";
import { requireFeature } from "@/lib/legacy/feature-gate";

export const dynamic = "force-dynamic";
// /guide/<page> → samma hanterare som /api/guide?page=<page>
export const GET = requireFeature("guides", adaptLegacyHandler(handler, "page"));
