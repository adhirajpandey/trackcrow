import { withRouteLogging } from "@/server/api/logging";
import { getRecipients as getRecipientsHandler } from "@/server/modules/recipients/controller";

export const GET = withRouteLogging(getRecipientsHandler);
