import { resolveApiToken } from "@/server/modules/api-tokens/service";
import { resolveOAuthAccessToken } from "@/server/modules/oauth/service";

export function resolveMcpToken(token: string) {
  return token.startsWith("tc_at_")
    ? resolveOAuthAccessToken(token)
    : resolveApiToken(token);
}
