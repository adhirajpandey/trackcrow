-- AlterTable
ALTER TABLE "public"."Transaction" ADD COLUMN     "recipient_name" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'UPI',
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
