import { withRouteLogging } from "@/server/api/logging";
import { getRules, postRule } from "@/server/modules/rules/controller";

export const GET = withRouteLogging(getRules);
export const POST = withRouteLogging(postRule);
