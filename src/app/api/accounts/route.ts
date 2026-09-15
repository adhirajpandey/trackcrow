import { getAccounts, postAccount } from "@/server/modules/accounts/controller";
import { withRouteLogging } from "@/server/api/logging";

export const GET = withRouteLogging(getAccounts);
export const POST = withRouteLogging(postAccount);
