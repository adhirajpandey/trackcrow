import { withRouteLogging } from "@/server/api/logging";
import { getAuthorize } from "@/server/modules/oauth/controller";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = withRouteLogging(getAuthorize);
