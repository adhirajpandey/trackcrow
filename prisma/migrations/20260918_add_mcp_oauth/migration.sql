-- CreateTable
CREATE TABLE "oauth_connection" (
    "uuid" TEXT NOT NULL,
    "user_uuid" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "scopes" "ApiTokenScope"[],
    "resource" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_connection_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "oauth_authorization_code" (
    "uuid" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "consentNonce" TEXT NOT NULL,
    "connectionUuid" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "codeChallenge" TEXT NOT NULL,
    "scopes" "ApiTokenScope"[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "oauth_authorization_code_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "oauth_access_token" (
    "uuid" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "connectionUuid" TEXT NOT NULL,
    "scopes" "ApiTokenScope"[],
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_access_token_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "oauth_refresh_token" (
    "uuid" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "connectionUuid" TEXT NOT NULL,
    "scopes" "ApiTokenScope"[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "replacedByTokenUuid" TEXT,

    CONSTRAINT "oauth_refresh_token_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "oauth_connection_user_uuid_createdAt_idx" ON "oauth_connection"("user_uuid", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_authorization_code_codeHash_key" ON "oauth_authorization_code"("codeHash");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_authorization_code_consentNonce_key" ON "oauth_authorization_code"("consentNonce");

-- CreateIndex
CREATE INDEX "oauth_authorization_code_connectionUuid_idx" ON "oauth_authorization_code"("connectionUuid");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_access_token_tokenHash_key" ON "oauth_access_token"("tokenHash");

-- CreateIndex
CREATE INDEX "oauth_access_token_connectionUuid_idx" ON "oauth_access_token"("connectionUuid");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_refresh_token_tokenHash_key" ON "oauth_refresh_token"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_refresh_token_replacedByTokenUuid_key" ON "oauth_refresh_token"("replacedByTokenUuid");

-- CreateIndex
CREATE INDEX "oauth_refresh_token_connectionUuid_idx" ON "oauth_refresh_token"("connectionUuid");

-- AddForeignKey
ALTER TABLE "oauth_connection" ADD CONSTRAINT "oauth_connection_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_authorization_code" ADD CONSTRAINT "oauth_authorization_code_connectionUuid_fkey" FOREIGN KEY ("connectionUuid") REFERENCES "oauth_connection"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_connectionUuid_fkey" FOREIGN KEY ("connectionUuid") REFERENCES "oauth_connection"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_replacedByTokenUuid_fkey" FOREIGN KEY ("replacedByTokenUuid") REFERENCES "oauth_refresh_token"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_connectionUuid_fkey" FOREIGN KEY ("connectionUuid") REFERENCES "oauth_connection"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
