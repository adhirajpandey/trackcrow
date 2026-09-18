import { resourceMetadata } from "@/server/modules/oauth/config";
import { oauthFailure } from "@/server/modules/oauth/http";
export const dynamic = "force-dynamic";
export function GET() {
  try {
    return Response.json(resourceMetadata(), {
      headers: {
        "access-control-allow-origin": "*",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return oauthFailure(error);
  }
}
