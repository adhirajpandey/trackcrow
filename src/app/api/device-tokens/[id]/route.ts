import { withRouteLogging } from "@/server/api/logging";
import { removeLegacyDeviceToken } from "@/server/modules/api-tokens/controller";

export const DELETE = withRouteLogging(removeLegacyDeviceToken);
