import { requirePageSessionUser } from "@/server/auth/session";
import { listApiTokens } from "@/server/modules/api-tokens/service";

import { TokenSettings } from "./token-settings";

export default async function SettingsPage() {
  const user = await requirePageSessionUser();
  const result = await listApiTokens({ userUuid: user.userUuid });
  const tokens = result.ok
    ? result.data.map((token) => ({
        ...token,
        createdAt: token.createdAt.toISOString(),
        lastUsedAt: token.lastUsedAt?.toISOString() ?? null,
        revokedAt: token.revokedAt?.toISOString() ?? null,
      }))
    : [];

  return <TokenSettings initialTokens={tokens} />;
}
