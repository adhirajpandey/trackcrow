import { withRouteLogging } from "@/server/api/logging";
import {
  getRuleByUuid,
  patchRule,
  removeRule,
} from "@/server/modules/rules/controller";

export const GET = withRouteLogging(getRuleByUuid);
export const PATCH = withRouteLogging(patchRule);
export const DELETE = withRouteLogging(removeRule);
