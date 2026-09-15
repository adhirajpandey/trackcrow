BEGIN;

CREATE TABLE "account" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "user_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "account_uuid_key" ON "account"("uuid");
CREATE UNIQUE INDEX "account_user_uuid_normalized_name_key" ON "account"("user_uuid", "normalized_name");
ALTER TABLE "account" ADD CONSTRAINT "account_user_uuid_fkey"
  FOREIGN KEY ("user_uuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "transaction" ADD COLUMN "account_id" INTEGER;

WITH cleaned AS (
  SELECT
    "id",
    "user_uuid",
    btrim(regexp_replace("account_label", '\s+', ' ', 'g')) AS name,
    lower(btrim(regexp_replace("account_label", '\s+', ' ', 'g'))) AS normalized_name,
    ROW_NUMBER() OVER (
      PARTITION BY "user_uuid", lower(btrim(regexp_replace("account_label", '\s+', ' ', 'g')))
      ORDER BY "timestamp", "id"
    ) AS rank
  FROM "transaction"
  WHERE "account_label" IS NOT NULL
    AND btrim(regexp_replace("account_label", '\s+', ' ', 'g')) <> ''
)
INSERT INTO "account" ("uuid", "user_uuid", "name", "normalized_name", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, "user_uuid", name, normalized_name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM cleaned
WHERE rank = 1;

UPDATE "transaction" AS transaction
SET "account_id" = account."id"
FROM "account" AS account
WHERE account."user_uuid" = transaction."user_uuid"
  AND account."normalized_name" = lower(btrim(regexp_replace(transaction."account_label", '\s+', ' ', 'g')))
  AND transaction."account_label" IS NOT NULL
  AND btrim(regexp_replace(transaction."account_label", '\s+', ' ', 'g')) <> '';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "transaction"
    WHERE "account_label" IS NOT NULL
      AND btrim(regexp_replace("account_label", '\s+', ' ', 'g')) <> ''
      AND "account_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Account backfill left labeled transactions unlinked';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "transaction" transaction
    JOIN "account" account ON account."id" = transaction."account_id"
    WHERE account."user_uuid" <> transaction."user_uuid"
  ) THEN
    RAISE EXCEPTION 'Account backfill linked a transaction to another user';
  END IF;
END $$;

ALTER TABLE "transaction" DROP COLUMN "account_label";
CREATE INDEX "transaction_user_uuid_account_id_idx" ON "transaction"("user_uuid", "account_id");
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_account_id_fkey"
  FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
