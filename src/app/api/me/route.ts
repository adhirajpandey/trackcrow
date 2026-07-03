import { withRouteLogging } from "@/server/api/logging";
import { getCurrentUser as getCurrentUserHandler } from "@/server/modules/users/controller";

export const GET = withRouteLogging(getCurrentUserHandler);
