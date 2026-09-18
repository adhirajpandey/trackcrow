import { withRouteLogging } from "@/server/api/logging";
import { postConsent } from "@/server/modules/oauth/controller";
export const runtime = "nodejs";
export const POST = withRouteLogging(postConsent);
