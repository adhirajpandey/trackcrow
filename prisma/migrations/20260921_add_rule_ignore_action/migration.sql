CREATE TYPE "RuleActionType" AS ENUM ('CATEGORIZE', 'IGNORE');

ALTER TABLE "rule"
  ADD COLUMN "action_type" "RuleActionType" NOT NULL DEFAULT 'CATEGORIZE';

ALTER TABLE "rule" DROP CONSTRAINT "rule_enabled_action_check";
ALTER TABLE "rule" ADD CONSTRAINT "rule_enabled_action_check" CHECK (
  NOT "is_enabled" OR (
    "action_status" = 'VALID' AND (
      ("action_type" = 'CATEGORIZE' AND "category_id" IS NOT NULL)
      OR ("action_type" = 'IGNORE' AND "category_id" IS NULL AND "subcategory_id" IS NULL)
    )
  )
);

ALTER TABLE "rule" ADD CONSTRAINT "rule_ignore_no_category_check" CHECK (
  "action_type" <> 'IGNORE' OR ("category_id" IS NULL AND "subcategory_id" IS NULL)
);
