import { createMcpHandler } from "@modelcontextprotocol/server";

import { withRouteLogging } from "@/server/api/logging";
import { createTrackCrowMcpServer } from "@/server/mcp/server";
import { enforceMcpBodyLimit, protectMcpRequest } from "@/server/mcp/request-protection";
import { cors } from "@/server/modules/oauth/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStore(response: Response) {
  response.headers.set("cache-control", "no-store");
  return response;
}

function allowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const allowed = (process.env.MCP_ALLOWED_ORIGINS ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  return allowed.includes(origin);
}

async function postMcp(request: Request) {
  const protection = await protectMcpRequest(request);
  if (!protection.ok) return protection.response;
  if (!allowedOrigin(request)) return new Response(JSON.stringify({ error: "Origin not allowed" }), { status: 403, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  const limitedRequest = await enforceMcpBodyLimit(request);
  if (!limitedRequest) return new Response(JSON.stringify({ error: "Request body too large" }), { status: 413, headers: { "content-type": "application/json", "cache-control": "no-store" } });

  const handler = createMcpHandler(
    () => createTrackCrowMcpServer(protection.identity),
    { legacy: "stateless", onerror: () => undefined }
  );
  return noStore(await handler.fetch(limitedRequest));
}

function methodNotAllowed() {
  return new Response(null, { status: 405, headers: { allow: "POST", "cache-control": "no-store" } });
}

export const POST = withRouteLogging(async (request: Request) => cors(request, await postMcp(request)));
export function OPTIONS(request: Request) { return cors(request, new Response(null, { status: 204, headers: { "cache-control": "no-store" } })); }
export const GET = withRouteLogging(methodNotAllowed);
export const DELETE = withRouteLogging(methodNotAllowed);
