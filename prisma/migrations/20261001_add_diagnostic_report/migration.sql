-- CreateTable
CREATE TABLE "diagnostic_report" (
    "uuid" TEXT NOT NULL,
    "user_uuid" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'report',
    "app_version" TEXT NOT NULL,
    "version_code" INTEGER NOT NULL,
    "device" JSONB NOT NULL,
    "note" TEXT,
    "entries" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnostic_report_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "diagnostic_report_user_uuid_createdAt_idx" ON "diagnostic_report"("user_uuid", "createdAt");

-- AddForeignKey
ALTER TABLE "diagnostic_report" ADD CONSTRAINT "diagnostic_report_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- Keep report kinds consistent even for direct database writes.
ALTER TABLE "diagnostic_report" ADD CONSTRAINT "diagnostic_report_kind_check"
CHECK ("kind" IN ('report', 'bank_request'));
