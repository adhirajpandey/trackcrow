import { withRouteLogging } from "@/server/api/logging";
import { postSubcategory as postSubcategoryHandler } from "@/server/modules/categories/controller";

export const POST = withRouteLogging(postSubcategoryHandler);
