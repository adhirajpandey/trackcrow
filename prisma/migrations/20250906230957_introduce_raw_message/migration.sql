/*
  Warnings:

  - Changed the type of `input_mode` on the `transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."InputType" AS ENUM ('AUTO', 'MANUAL');

-- AlterTable
ALTER TABLE "public"."transaction" ADD COLUMN     "raw_message" TEXT,
DROP COLUMN "input_mode",
ADD COLUMN     "input_mode" "public"."InputType" NOT NULL;
