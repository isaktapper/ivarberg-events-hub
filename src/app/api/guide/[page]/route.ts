import handler from "../../../../../legacy-api/guide";
import { adaptLegacyHandler } from "@/lib/legacy/vercel-adapter";

export const dynamic = "force-dynamic";
// /guide/<page> → samma hanterare som /api/guide?page=<page>
export const GET = adaptLegacyHandler(handler, "page");
