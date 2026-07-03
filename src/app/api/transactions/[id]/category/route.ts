import { withRouteLogging } from "@/server/api/logging";
import { patchTransactionCategory as patchTransactionCategoryHandler } from "@/server/modules/transactions/controller";

export const PATCH = withRouteLogging(patchTransactionCategoryHandler);
