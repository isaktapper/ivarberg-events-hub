import handler from "../../../../../legacy-api/kategori";
import { adaptLegacyHandler } from "@/lib/legacy/vercel-adapter";

export const dynamic = "force-dynamic";
// /kategori/<slug> → samma hanterare som /api/kategori?slug=<slug>
export const GET = adaptLegacyHandler(handler, "slug");
