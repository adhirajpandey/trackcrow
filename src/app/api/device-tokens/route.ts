import { withRouteLogging } from "@/server/api/logging";
import { getLegacyDeviceTokens, postApiToken } from "@/server/modules/api-tokens/controller";

export const GET = withRouteLogging(getLegacyDeviceTokens);
export const POST = withRouteLogging((request) => postApiToken(request, true));
