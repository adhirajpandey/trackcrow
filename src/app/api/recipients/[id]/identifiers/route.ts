import { withRouteLogging } from "@/server/api/logging";
import { postRecipientIdentifier as postRecipientIdentifierHandler } from "@/server/modules/recipients/controller";

export const POST = withRouteLogging(postRecipientIdentifierHandler);
