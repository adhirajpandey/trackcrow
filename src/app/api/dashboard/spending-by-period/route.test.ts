import { GET } from "./route";

import { requireSessionUser } from "@/server/auth/session";
import { getSpendingByPeriod } from "@/server/modules/dashboard/service";
import { parseJson } from "@/test/api-test-helpers";

jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/dashboard/service", () => ({
  getSpendingByPeriod: jest.fn(),
}));

const requireSessionUserMock = requireSessionUser as jest.Mock;
const getSpendingByPeriodMock = getSpendingByPeriod as jest.Mock;

describe("GET /api/dashboard/spending-by-period", () => {
  it("returns grouped periods", async () => {
    requireSessionUserMock.mockResolvedValueOnce({ ok: true, data: { userUuid: "u1" } });
    getSpendingByPeriodMock.mockResolvedValueOnce({
      ok: true,
      data: [{ period: "2026-06", totalSpend: 120, transactionCount: 3 }],
    });

    const response = await GET(new Request("http://localhost/api/dashboard/spending-by-period"));
    const body = await parseJson<Array<{ period: string }>>(response);

    expect(response.status).toBe(200);
    expect(body[0]?.period).toBe("2026-06");
  });
});
