ALTER TABLE "raw_message" ALTER COLUMN "body" DROP NOT NULL;
ALTER TABLE "raw_message" ADD COLUMN "sender" TEXT;
ALTER TABLE "raw_message" ADD COLUMN "idempotency_key" TEXT;

CREATE UNIQUE INDEX "raw_message_user_uuid_idempotency_key_key" ON "raw_message"("user_uuid", "idempotency_key");
