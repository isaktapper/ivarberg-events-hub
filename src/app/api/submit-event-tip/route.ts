import handler from "../../../../legacy-api/submit-event-tip";
import { adaptLegacyHandler } from "@/lib/legacy/vercel-adapter";

export const dynamic = "force-dynamic";
const adapted = adaptLegacyHandler(handler);
// Hanteraren svarar själv 405 på annat än POST, precis som tidigare
export const GET = adapted;
export const POST = adapted;
