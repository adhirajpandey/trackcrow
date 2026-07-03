import { withRouteLogging } from "@/server/api/logging";
import { getTransactionSuggestion as getTransactionSuggestionHandler } from "@/server/modules/transactions/controller";

export const GET = withRouteLogging(getTransactionSuggestionHandler);
