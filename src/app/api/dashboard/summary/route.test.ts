import { GET } from "./route";

import { requireSessionUser } from "@/server/auth/session";
import { getDashboardSummary } from "@/server/modules/dashboard/service";
import { parseJson } from "@/test/api-test-helpers";

jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/dashboard/service", () => ({
  getDashboardSummary: jest.fn(),
}));

const requireSessionUserMock = requireSessionUser as jest.Mock;
const getDashboardSummaryMock = getDashboardSummary as jest.Mock;

describe("GET /api/dashboard/summary", () => {
  it("returns summary", async () => {
    requireSessionUserMock.mockResolvedValueOnce({ ok: true, data: { userUuid: "u1" } });
    getDashboardSummaryMock.mockResolvedValueOnce({
      ok: true,
      data: { totalSpend: 100, transactionCount: 2, categorizedCount: 1, uncategorizedCount: 1, averageSpend: 50 },
    });

    const response = await GET(new Request("http://localhost/api/dashboard/summary"));
    const body = await parseJson<{ totalSpend: number }>(response);

    expect(response.status).toBe(200);
    expect(body.totalSpend).toBe(100);
  });
});
