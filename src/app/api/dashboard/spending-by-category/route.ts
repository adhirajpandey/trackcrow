import { withRouteLogging } from "@/server/api/logging";
import { getCategorySpending as getCategorySpendingHandler } from "@/server/modules/dashboard/controller";

export const GET = withRouteLogging(getCategorySpendingHandler);
