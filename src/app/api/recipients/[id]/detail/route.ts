import { withRouteLogging } from "@/server/api/logging";
import { getRecipientDetailById } from "@/server/modules/recipients/controller";

export const GET = withRouteLogging(getRecipientDetailById);
