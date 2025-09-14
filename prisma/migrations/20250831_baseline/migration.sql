-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "uuid" TEXT NOT NULL,
    "id" SERIAL NOT NULL,
    "user_uuid" TEXT NOT NULL,
    "input_mode" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "recipient" TEXT NOT NULL,
    "category" TEXT,
    "subcategory" TEXT,
    "reference" TEXT,
    "account" TEXT,
    "remarks" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ist_datetime" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "uuid" TEXT NOT NULL,
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "premium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username" ASC);

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "public"."User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

