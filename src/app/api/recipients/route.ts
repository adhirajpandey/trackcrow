import { withRouteLogging } from "@/server/api/logging";
import {
  getRecipients as getRecipientsHandler,
  postRecipient as postRecipientHandler,
} from "@/server/modules/recipients/controller";

export const GET = withRouteLogging(getRecipientsHandler);
export const POST = withRouteLogging(postRecipientHandler);
