import { withRouteLogging } from "@/server/api/logging";
import {
  getTransaction as getTransactionHandler,
  patchTransaction as patchTransactionHandler,
  removeTransaction as removeTransactionHandler,
} from "@/server/modules/transactions/controller";

export const GET = withRouteLogging(getTransactionHandler);
export const PATCH = withRouteLogging(patchTransactionHandler);
export const DELETE = withRouteLogging(removeTransactionHandler);
