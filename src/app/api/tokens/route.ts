import { withRouteLogging } from "@/server/api/logging";
import { getApiTokens, postApiToken } from "@/server/modules/api-tokens/controller";

export const GET = withRouteLogging(getApiTokens);
export const POST = withRouteLogging((request) => postApiToken(request));
