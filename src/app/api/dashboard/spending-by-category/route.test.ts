import { GET } from "./route";

import { requireSessionUser } from "@/server/auth/session";
import { getSpendingByCategory } from "@/server/modules/dashboard/service";
import { parseJson } from "@/test/api-test-helpers";

jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/dashboard/service", () => ({
  getSpendingByCategory: jest.fn(),
}));

const requireSessionUserMock = requireSessionUser as jest.Mock;
const getSpendingByCategoryMock = getSpendingByCategory as jest.Mock;

describe("GET /api/dashboard/spending-by-category", () => {
  it("returns grouped spends", async () => {
    requireSessionUserMock.mockResolvedValueOnce({ ok: true, data: { userUuid: "u1" } });
    getSpendingByCategoryMock.mockResolvedValueOnce({
      ok: true,
      data: [{ category: "Food", totalSpend: 120, transactionCount: 3 }],
    });

    const response = await GET(new Request("http://localhost/api/dashboard/spending-by-category"));
    const body = await parseJson<Array<{ category: string }>>(response);

    expect(response.status).toBe(200);
    expect(body[0]?.category).toBe("Food");
  });
});
