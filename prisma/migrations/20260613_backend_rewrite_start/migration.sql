-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('UPI', 'CARD', 'CASH', 'NETBANKING', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('SMS', 'MANUAL');

-- CreateEnum
CREATE TYPE "RawMessageSource" AS ENUM ('SMS');

-- CreateEnum
CREATE TYPE "ParseStatus" AS ENUM ('PARSED', 'UNPARSEABLE', 'FAILED');

-- CreateEnum
CREATE TYPE "RecipientIdentifierKind" AS ENUM ('UPI_ID', 'PHONE', 'CARD_MERCHANT', 'BANK_ACCOUNT', 'TEXT');

-- CreateTable
CREATE TABLE "user" (
    "uuid" TEXT NOT NULL,
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "provider" TEXT NOT NULL,
    "subscription" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "category" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "user_uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcategory" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "user_uuid" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipient" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "user_uuid" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipient_identifier" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "user_uuid" TEXT NOT NULL,
    "recipient_id" INTEGER NOT NULL,
    "kind" "RecipientIdentifierKind" NOT NULL,
    "value" TEXT NOT NULL,
    "normalized_value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipient_identifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "user_uuid" TEXT NOT NULL,
    "recipient_id" INTEGER NOT NULL,
    "category_id" INTEGER,
    "subcategory_id" INTEGER,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "type" "TransactionType" NOT NULL DEFAULT 'UPI',
    "source" "TransactionSource" NOT NULL,
    "recipient_raw" TEXT NOT NULL,
    "recipient_name" TEXT,
    "reference" TEXT,
    "account_label" TEXT,
    "remarks" TEXT,
    "location_raw" TEXT,
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_message" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "user_uuid" TEXT NOT NULL,
    "transaction_id" INTEGER,
    "body" TEXT NOT NULL,
    "source" "RawMessageSource" NOT NULL DEFAULT 'SMS',
    "parse_status" "ParseStatus" NOT NULL,
    "parser_name" TEXT,
    "failure_reason" TEXT,
    "parsed_payload" JSONB,
    "location_raw" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_token" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "user_uuid" TEXT NOT NULL,
    "label" TEXT,
    "token_hash" TEXT NOT NULL,
    "token_prefix" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "device_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_id_key" ON "user"("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "category_uuid_key" ON "category"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "category_user_uuid_name_key" ON "category"("user_uuid", "name");

-- CreateIndex
CREATE UNIQUE INDEX "subcategory_uuid_key" ON "subcategory"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "subcategory_categoryId_name_key" ON "subcategory"("categoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "recipient_uuid_key" ON "recipient"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "recipient_user_uuid_normalized_name_key" ON "recipient"("user_uuid", "normalized_name");

-- CreateIndex
CREATE UNIQUE INDEX "recipient_identifier_uuid_key" ON "recipient_identifier"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "recipient_identifier_user_uuid_kind_normalized_value_key" ON "recipient_identifier"("user_uuid", "kind", "normalized_value");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_uuid_key" ON "transaction"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "raw_message_uuid_key" ON "raw_message"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "device_token_uuid_key" ON "device_token"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "device_token_token_hash_key" ON "device_token"("token_hash");

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcategory" ADD CONSTRAINT "subcategory_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcategory" ADD CONSTRAINT "subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipient" ADD CONSTRAINT "recipient_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipient_identifier" ADD CONSTRAINT "recipient_identifier_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "recipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "recipient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_message" ADD CONSTRAINT "raw_message_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_message" ADD CONSTRAINT "raw_message_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_token" ADD CONSTRAINT "device_token_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
