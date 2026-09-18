import type { ApiTokenScope } from "@/generated/prisma-rewrite";

export type ApiTokenDto = {
  uuid: string;
  label: string | null;
  tokenPrefix: string;
  scopes: ApiTokenScope[];
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
};

export type AuthenticatedToken = {
  userUuid: string;
  tokenUuid: string;
  scopes: ApiTokenScope[];
  connectionUuid?: string;
};
