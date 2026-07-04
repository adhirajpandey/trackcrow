import { withRouteLogging } from "@/server/api/logging";
import { postRecipientAlias as postRecipientAliasHandler } from "@/server/modules/recipients/controller";

export const POST = withRouteLogging(postRecipientAliasHandler);
