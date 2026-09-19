import { withRouteLogging } from "@/server/api/logging";
import { postToken } from "@/server/modules/oauth/controller";
import { cors, noStoreHeaders } from "@/server/modules/oauth/http";
export const runtime = "nodejs";
export const POST = withRouteLogging(postToken);
export function OPTIONS(request: Request) {
  return cors(
    request,
    new Response(null, { status: 204, headers: noStoreHeaders }),
  );
}
