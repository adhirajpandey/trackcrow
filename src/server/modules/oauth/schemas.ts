import { z } from "zod";
import { ApiTokenScope } from "@/generated/prisma-rewrite";
import { OAUTH_SCOPES } from "./config";

export class OAuthError extends Error {
  constructor(
    public readonly code: string,
    public readonly status = 400,
  ) {
    super(code);
  }
}

export const wireScope = z.enum(OAUTH_SCOPES);
export type WireScope = z.infer<typeof wireScope>;
export const scopeMap: Record<WireScope, ApiTokenScope> = {
  "transactions:read": ApiTokenScope.TRANSACTIONS_READ,
  "transactions:write": ApiTokenScope.TRANSACTIONS_WRITE,
};
export function parseScopes(value: string | null): WireScope[] {
  const parsed = z
    .array(wireScope)
    .min(1)
    .safeParse(value?.split(" ").filter(Boolean));
  if (!parsed.success) throw new OAuthError("invalid_scope");
  return [...new Set(parsed.data)];
}
export function scopesToWire(scopes: ApiTokenScope[]) {
  return OAUTH_SCOPES.filter((scope) => scopes.includes(scopeMap[scope])).join(
    " ",
  );
}
export function parameters(
  params: URLSearchParams,
  repeatable: readonly string[] = [],
) {
  for (const key of params.keys())
    if (!repeatable.includes(key) && params.getAll(key).length !== 1)
      throw new OAuthError("invalid_request");
  return params;
}
export function required(params: URLSearchParams, key: string, max = 2048) {
  const value = params.get(key);
  if (!value || value.length > max) throw new OAuthError("invalid_request");
  return value;
}
export const consentSchema = z.object({
  clientId: z.string(),
  clientName: z.string(),
  redirectUri: z.string(),
  resource: z.string(),
  scopes: z.array(wireScope).min(1),
  codeChallenge: z.string(),
  state: z.string().optional(),
  nonce: z.string().uuid(),
  browserHash: z.string(),
  expiresAt: z.number(),
  userUuid: z.string().optional(),
});
export type Consent = z.infer<typeof consentSchema>;
