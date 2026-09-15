import { withRouteLogging } from "@/server/api/logging";
import { patchAccount } from "@/server/modules/accounts/controller";

export const PATCH = withRouteLogging(patchAccount);
