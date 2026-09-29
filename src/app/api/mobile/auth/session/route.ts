import { withRouteLogging } from "@/server/api/logging";
import { deleteMobileSession } from "@/server/modules/mobile-auth/controller";

export const DELETE = withRouteLogging((request) => deleteMobileSession(request));
