import { withRouteLogging } from "@/server/api/logging";
import { postResetCategories as postResetCategoriesHandler } from "@/server/modules/categories/controller";

export const POST = withRouteLogging(postResetCategoriesHandler);
