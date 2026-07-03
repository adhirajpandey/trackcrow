import { withRouteLogging } from "@/server/api/logging";
import { postSmsImport as postSmsImportHandler } from "@/server/modules/imports/controller";

export const POST = withRouteLogging(postSmsImportHandler);
