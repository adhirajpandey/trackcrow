import { withRouteLogging } from "@/server/api/logging";
import { getRecipientById as getRecipientByIdHandler } from "@/server/modules/recipients/controller";

export const GET = withRouteLogging(getRecipientByIdHandler);
