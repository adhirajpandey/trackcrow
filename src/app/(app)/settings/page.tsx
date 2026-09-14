import { headers } from "next/headers";

import { requirePageSessionUser } from "@/server/auth/session";
import { listApiTokens } from "@/server/modules/api-tokens/service";

import { TokenSettings } from "./token-settings";

export default async function SettingsPage() {
  const requestHeaders = await headers();
  const host = (
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  )?.split(",")[0].trim();
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0].trim();
  const protocol = forwardedProtocol === "http" ? "http" : "https";
  const mcpUrl = host ? `${protocol}://${host}/mcp` : "/mcp";
  const user = await requirePageSessionUser();
  const result = await listApiTokens({ userUuid: user.userUuid });
  if (!result.ok) {
    throw new Error("Could not load API tokens");
  }
  const tokens = result.data.map((token) => ({
    ...token,
    createdAt: token.createdAt.toISOString(),
    lastUsedAt: token.lastUsedAt?.toISOString() ?? null,
    revokedAt: token.revokedAt?.toISOString() ?? null,
  }));

  return <TokenSettings initialTokens={tokens} mcpUrl={mcpUrl} />;
}
