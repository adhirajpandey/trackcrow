import { withRouteLogging } from "@/server/api/logging";
import { getGoogleConfig, postGoogleSignIn } from "@/server/modules/mobile-auth/controller";

export const GET = withRouteLogging(getGoogleConfig);
export const POST = withRouteLogging((request) => postGoogleSignIn(request));
