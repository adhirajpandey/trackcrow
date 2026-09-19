import { withRouteLogging } from "@/server/api/logging";
import { getConnections } from "@/server/modules/oauth/controller";
export const GET = withRouteLogging(getConnections);
