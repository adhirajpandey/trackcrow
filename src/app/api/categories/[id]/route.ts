import { withRouteLogging } from "@/server/api/logging";
import {
  patchCategory as patchCategoryHandler,
  removeCategory as removeCategoryHandler,
} from "@/server/modules/categories/controller";

export const PATCH = withRouteLogging(patchCategoryHandler);
export const DELETE = withRouteLogging(removeCategoryHandler);
