import { withRouteLogging } from "@/server/api/logging";
import {
  getDeviceTokens as getDeviceTokensHandler,
  postDeviceToken as postDeviceTokenHandler,
} from "@/server/modules/device-tokens/controller";

export const GET = withRouteLogging(getDeviceTokensHandler);
export const POST = withRouteLogging(postDeviceTokenHandler);
