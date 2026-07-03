import { withRouteLogging } from "@/server/api/logging";
import {
  getTransactions as getTransactionsHandler,
  postTransaction as postTransactionHandler,
} from "@/server/modules/transactions/controller";

export const GET = withRouteLogging(getTransactionsHandler);
export const POST = withRouteLogging(postTransactionHandler);
