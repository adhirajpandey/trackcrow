/*
  Warnings:

  - You are about to drop the column `premium` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "premium",
ADD COLUMN     "subscription" INTEGER NOT NULL DEFAULT 0;
