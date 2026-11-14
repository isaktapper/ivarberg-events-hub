import handler from "../../../../legacy-api/omrade";
import { adaptLegacyHandler } from "@/lib/legacy/vercel-adapter";
import { requireFeature } from "@/lib/legacy/feature-gate";

export const dynamic = "force-dynamic";
export const GET = requireFeature("taxonomyPages", adaptLegacyHandler(handler));
