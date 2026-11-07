import handler from "../../../../../legacy-api/sasong";
import { adaptLegacyHandler } from "@/lib/legacy/vercel-adapter";

export const dynamic = "force-dynamic";
// /<säsong>-i-varberg → /api/sasong/<slug> (rewrites i next.config.ts)
export const GET = adaptLegacyHandler(handler, "slug");
