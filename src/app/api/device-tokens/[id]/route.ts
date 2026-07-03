import { withRouteLogging } from "@/server/api/logging";
import { removeDeviceToken as removeDeviceTokenHandler } from "@/server/modules/device-tokens/controller";

export const DELETE = withRouteLogging(removeDeviceTokenHandler);
