import { withRouteLogging } from "@/server/api/logging";
import { removeApiToken } from "@/server/modules/api-tokens/controller";

export const DELETE = withRouteLogging(removeApiToken);
