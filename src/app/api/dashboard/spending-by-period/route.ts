import { withRouteLogging } from "@/server/api/logging";
import { getPeriodSpending as getPeriodSpendingHandler } from "@/server/modules/dashboard/controller";

export const GET = withRouteLogging(getPeriodSpendingHandler);
