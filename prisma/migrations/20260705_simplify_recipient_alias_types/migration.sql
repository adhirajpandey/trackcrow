-- PHONE aliases were intentionally converted to TEXT before this migration.
-- BANK_ACCOUNT had no rows. Keep this guard explicit so enum cleanup cannot
-- orphan existing data.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "recipient_identifier"
    WHERE "kind" IN ('PHONE', 'BANK_ACCOUNT')
  ) THEN
    RAISE EXCEPTION 'Cannot remove recipient alias types while PHONE or BANK_ACCOUNT rows exist';
  END IF;
END $$;

ALTER TYPE "RecipientIdentifierKind" RENAME TO "RecipientIdentifierKind_old";
CREATE TYPE "RecipientIdentifierKind" AS ENUM ('UPI_ID', 'CARD_MERCHANT', 'TEXT');

ALTER TABLE "recipient_identifier"
  ALTER COLUMN "kind" TYPE "RecipientIdentifierKind"
  USING "kind"::text::"RecipientIdentifierKind";

DROP TYPE "RecipientIdentifierKind_old";
