import { getSenderConfig } from "./service";

export function getMobileConfig(request: Request) {
  const { body, etag } = getSenderConfig();
  const headers = {
    ETag: etag,
    "Cache-Control": "public, max-age=0, must-revalidate",
    "Content-Type": "application/json",
  };
  const tags =
    request.headers
      .get("if-none-match")
      ?.split(",")
      .map((tag) => tag.trim().replace(/^W\//, "")) ?? [];
  return tags.includes(etag) || tags.includes("*")
    ? new Response(null, { status: 304, headers })
    : new Response(body, { headers });
}
