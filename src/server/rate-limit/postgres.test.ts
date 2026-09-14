jest.mock("@/lib/prisma-rewrite", () => ({
  __esModule: true,
  default: ((globalThis as typeof globalThis & { __rateLimiterPrismaMock?: unknown }).__rateLimiterPrismaMock = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    rateLimitBucket: { findUnique: jest.fn() },
  }),
}));

import { logger } from "@/lib/logger";

import { PostgresRateLimiter } from "./postgres";

const prisma = (globalThis as typeof globalThis & { __rateLimiterPrismaMock: {
  $queryRaw: jest.Mock;
  $executeRaw: jest.Mock;
} }).__rateLimiterPrismaMock;

describe("PostgresRateLimiter", () => {
  beforeEach(() => jest.clearAllMocks());

  it("preserves a successful consume result when cleanup fails", async () => {
    prisma.$queryRaw.mockResolvedValue([{ count: 2, windowStart: new Date("2026-09-15T10:00:00Z") }]);
    prisma.$executeRaw.mockRejectedValue(new Error("cleanup failed"));

    await expect(new PostgresRateLimiter().consume("bucket", 5, 60)).resolves.toEqual({
      allowed: true,
      remaining: 3,
      resetAt: new Date("2026-09-15T10:01:00Z"),
    });
    expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({
      event: "rate_limit.cleanup_failed",
    }));
  });
});
