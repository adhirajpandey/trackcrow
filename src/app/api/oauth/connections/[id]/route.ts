import { withRouteLogging } from "@/server/api/logging";
import { removeConnection } from "@/server/modules/oauth/controller";
export const DELETE = withRouteLogging(removeConnection);
