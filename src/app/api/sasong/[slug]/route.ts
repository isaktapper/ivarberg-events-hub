import handler from "../../../../../legacy-api/sasong";
import { adaptLegacyHandler } from "@/lib/legacy/vercel-adapter";
import { requireFeature } from "@/lib/legacy/feature-gate";

export const dynamic = "force-dynamic";
// /<säsong>-i-varberg → /api/sasong/<slug> (rewrites i next.config.ts)
export const GET = requireFeature("seasons", adaptLegacyHandler(handler, "slug"));
