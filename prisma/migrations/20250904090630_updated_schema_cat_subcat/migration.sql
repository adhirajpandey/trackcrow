/*
  Warnings:

  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('UPI', 'CARD', 'CASH', 'NETBANKING', 'OTHER');

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_user_uuid_fkey";

-- DropTable
DROP TABLE "public"."Transaction";

-- DropTable
DROP TABLE "public"."User";

-- CreateTable
CREATE TABLE "public"."transaction" (
    "uuid" TEXT NOT NULL,
    "id" SERIAL NOT NULL,
    "user_uuid" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "type" "public"."TransactionType" NOT NULL DEFAULT 'UPI',
    "recipient" TEXT NOT NULL,
    "input_mode" TEXT NOT NULL,
    "ist_datetime" TIMESTAMP(3) NOT NULL,
    "recipient_name" TEXT,
    "reference" TEXT,
    "account" TEXT,
    "remarks" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" INTEGER,
    "subcategoryId" INTEGER,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."user" (
    "uuid" TEXT NOT NULL,
    "id" SERIAL NOT NULL,
    "subscription" INTEGER NOT NULL DEFAULT 0,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "provider" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "user_uuid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subcategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "user_uuid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subcategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transaction_id_key" ON "public"."transaction"("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_id_key" ON "public"."user"("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "category_name_user_uuid_key" ON "public"."category"("name", "user_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "subcategory_name_categoryId_key" ON "public"."subcategory"("name", "categoryId");

-- AddForeignKey
ALTER TABLE "public"."transaction" ADD CONSTRAINT "transaction_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "public"."user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transaction" ADD CONSTRAINT "transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transaction" ADD CONSTRAINT "transaction_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "public"."subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."category" ADD CONSTRAINT "category_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "public"."user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subcategory" ADD CONSTRAINT "subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subcategory" ADD CONSTRAINT "subcategory_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "public"."user"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
