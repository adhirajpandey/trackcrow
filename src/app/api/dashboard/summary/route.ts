import { withRouteLogging } from "@/server/api/logging";
import { getSummary as getSummaryHandler } from "@/server/modules/dashboard/controller";

export const GET = withRouteLogging(getSummaryHandler);
