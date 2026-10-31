import handler from "../../../../legacy-api/landing";
import { adaptLegacyHandler } from "@/lib/legacy/vercel-adapter";

export const dynamic = "force-dynamic";
export const GET = adaptLegacyHandler(handler);
