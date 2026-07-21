CREATE TYPE "ClassificationSource" AS ENUM ('MANUAL', 'SUGGESTION', 'RULE');
CREATE TYPE "RuleActionStatus" AS ENUM ('VALID', 'NEEDS_REPAIR');

CREATE TABLE "rule" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "user_uuid" TEXT NOT NULL,
    "recipient_id" INTEGER NOT NULL,
    "category_id" INTEGER,
    "subcategory_id" INTEGER,
    "name" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "action_status" "RuleActionStatus" NOT NULL DEFAULT 'VALID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "rule_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "rule_enabled_action_check" CHECK (NOT "is_enabled" OR ("action_status" = 'VALID' AND "category_id" IS NOT NULL)),
    CONSTRAINT "rule_repair_disabled_check" CHECK ("action_status" <> 'NEEDS_REPAIR' OR NOT "is_enabled")
);

ALTER TABLE "transaction"
  ADD COLUMN "classification_source" "ClassificationSource",
  ADD COLUMN "classification_rule_id" INTEGER,
  ADD COLUMN "classification_changed_at" TIMESTAMP(3);

UPDATE "transaction"
SET "classification_source" = 'MANUAL'
WHERE "category_id" IS NOT NULL;

ALTER TABLE "transaction" ADD CONSTRAINT "transaction_classification_check" CHECK (
  ("classification_source" = 'RULE' AND "classification_rule_id" IS NOT NULL AND "category_id" IS NOT NULL)
  OR
  ("classification_source" IS DISTINCT FROM 'RULE' AND "classification_rule_id" IS NULL)
);

CREATE UNIQUE INDEX "rule_uuid_key" ON "rule"("uuid");
CREATE INDEX "rule_user_uuid_is_enabled_updatedAt_idx" ON "rule"("user_uuid", "is_enabled", "updatedAt");
CREATE INDEX "rule_recipient_id_idx" ON "rule"("recipient_id");
CREATE UNIQUE INDEX "rule_enabled_recipient_unique" ON "rule"("user_uuid", "recipient_id")
WHERE "is_enabled" = true AND "deleted_at" IS NULL;

ALTER TABLE "rule" ADD CONSTRAINT "rule_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rule" ADD CONSTRAINT "rule_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "recipient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rule" ADD CONSTRAINT "rule_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "rule" ADD CONSTRAINT "rule_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_classification_rule_id_fkey" FOREIGN KEY ("classification_rule_id") REFERENCES "rule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
