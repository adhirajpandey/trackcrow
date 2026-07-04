import { withRouteLogging } from "@/server/api/logging";
import {
  getRecipientById as getRecipientByIdHandler,
  patchRecipient as patchRecipientHandler,
} from "@/server/modules/recipients/controller";

export const GET = withRouteLogging(getRecipientByIdHandler);
export const PATCH = withRouteLogging(patchRecipientHandler);
