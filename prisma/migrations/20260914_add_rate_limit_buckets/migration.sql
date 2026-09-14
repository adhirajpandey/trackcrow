CREATE TABLE "rate_limit_bucket" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL,
  "window_start" TIMESTAMPTZ(6) NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "rate_limit_bucket_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "rate_limit_bucket_expires_at_idx"
  ON "rate_limit_bucket"("expires_at");
