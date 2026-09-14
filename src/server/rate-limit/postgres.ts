import { Prisma } from "@/generated/prisma-rewrite";
import prisma from "@/lib/prisma-rewrite";

import type { RateLimiter, RateLimitResult } from "./types";

type BucketRow = { count: number; windowStart: Date };

function result(row: BucketRow, limit: number, windowSeconds: number): RateLimitResult {
  const resetAt = new Date(row.windowStart.getTime() + windowSeconds * 1000);
  return {
    allowed: row.count <= limit,
    remaining: Math.max(0, limit - row.count),
    resetAt,
  };
}

export class PostgresRateLimiter implements RateLimiter {
  async consume(key: string, limit: number, windowSeconds: number) {
    const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
      INSERT INTO "rate_limit_bucket" ("key", "count", "window_start", "expires_at")
      VALUES (${key}, 1, NOW(), NOW() + (${windowSeconds} * INTERVAL '1 second'))
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "rate_limit_bucket"."expires_at" <= NOW() THEN 1
          ELSE "rate_limit_bucket"."count" + 1
        END,
        "window_start" = CASE
          WHEN "rate_limit_bucket"."expires_at" <= NOW() THEN NOW()
          ELSE "rate_limit_bucket"."window_start"
        END,
        "expires_at" = CASE
          WHEN "rate_limit_bucket"."expires_at" <= NOW()
            THEN NOW() + (${windowSeconds} * INTERVAL '1 second')
          ELSE "rate_limit_bucket"."expires_at"
        END
      RETURNING "count", "window_start" AS "windowStart"
    `);

    await this.cleanup();
    return result(rows[0], limit, windowSeconds);
  }

  async check(key: string, limit: number, windowSeconds: number) {
    const now = new Date();
    const row = await prisma.rateLimitBucket.findUnique({
      where: { key },
      select: { count: true, windowStart: true, expiresAt: true },
    });
    if (!row || row.expiresAt <= now) {
      return { allowed: true, remaining: limit, resetAt: new Date(now.getTime() + windowSeconds * 1000) };
    }
    return result(row, limit, windowSeconds);
  }

  private async cleanup() {
    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM "rate_limit_bucket"
      WHERE "key" IN (
        SELECT "key" FROM "rate_limit_bucket"
        WHERE "expires_at" < NOW() - INTERVAL '5 minutes'
        ORDER BY "expires_at" ASC
        LIMIT 25
      )
    `);
  }
}
