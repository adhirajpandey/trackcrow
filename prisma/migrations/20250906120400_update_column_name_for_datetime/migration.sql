/*
  Warnings:

  - You are about to drop the column `ist_datetime` on the `transaction` table. All the data in the column will be lost.
  - Added the required column `timestamp` to the `transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."transaction" DROP COLUMN "ist_datetime",
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL;
