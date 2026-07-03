import { withRouteLogging } from "@/server/api/logging";
import {
  patchSubcategory as patchSubcategoryHandler,
  removeSubcategory as removeSubcategoryHandler,
} from "@/server/modules/categories/controller";

export const PATCH = withRouteLogging(patchSubcategoryHandler);
export const DELETE = withRouteLogging(removeSubcategoryHandler);
