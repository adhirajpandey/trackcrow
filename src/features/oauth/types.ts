export type OAuthConnectionDto = {
  uuid: string;
  clientId: string;
  clientName: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  expiresAt: string;
};
