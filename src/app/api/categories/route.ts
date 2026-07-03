import { withRouteLogging } from "@/server/api/logging";
import {
  getCategories as getCategoriesHandler,
  postCategory as postCategoryHandler,
} from "@/server/modules/categories/controller";

export const GET = withRouteLogging(getCategoriesHandler);
export const POST = withRouteLogging(postCategoryHandler);
