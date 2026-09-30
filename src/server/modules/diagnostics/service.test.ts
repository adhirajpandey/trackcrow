jest.mock("@/lib/prisma-rewrite", () => ({
  __esModule: true,
  default: { diagnosticReport: { create: jest.fn() } },
}));
jest.mock("@/server/rate-limit/postgres", () => ({
  PostgresRateLimiter: jest.fn(() => ({
    consume: (...args: unknown[]) => mockConsume(...args),
  })),
}));
const mockConsume = jest.fn();

import prisma from "@/lib/prisma-rewrite";
import { saveDiagnosticReport } from "./service";

const input = {
  kind: "report" as const,
  appVersion: "0.1.0",
  versionCode: 3,
  device: { androidVersion: "16" },
  entries: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockConsume.mockResolvedValue({ allowed: true });
  jest
    .mocked(prisma.diagnosticReport.create)
    .mockResolvedValue({ uuid: "report-1" } as never);
});

it("stores a report owned by the authenticated user and consumes their shared daily bucket", async () => {
  expect(await saveDiagnosticReport("user-1", input)).toEqual({
    status: "created",
    uuid: "report-1",
  });
  expect(mockConsume).toHaveBeenCalledWith("diagnostics:user-1", 10, 86400);
  expect(prisma.diagnosticReport.create).toHaveBeenCalledWith({
    data: { ...input, userUuid: "user-1", note: null },
    select: { uuid: true },
  });
});

it("shares the limit across bank requests and reports and never stores an eleventh report", async () => {
  const resetAt = new Date("2026-10-02T00:00:00Z");
  mockConsume.mockResolvedValue({ allowed: false, resetAt });
  expect(
    await saveDiagnosticReport("user-1", {
      ...input,
      kind: "bank_request",
      note: "Example Bank",
    }),
  ).toEqual({ status: "limited", resetAt });
  expect(mockConsume).toHaveBeenCalledWith("diagnostics:user-1", 10, 86400);
  expect(prisma.diagnosticReport.create).not.toHaveBeenCalled();
});

it("uses distinct buckets for different users", async () => {
  await saveDiagnosticReport("user-1", input);
  await saveDiagnosticReport("user-2", input);
  expect(mockConsume.mock.calls.map(([key]) => key)).toEqual([
    "diagnostics:user-1",
    "diagnostics:user-2",
  ]);
});
