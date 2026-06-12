import { GET } from "./route";

import { requireSessionUser } from "@/server/auth/session";
import { suggestTransactionCategory } from "@/server/modules/transactions/service";
import { parseJson } from "@/test/api-test-helpers";

jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/transactions/service", () => ({
  suggestTransactionCategory: jest.fn(),
}));

const requireSessionUserMock = requireSessionUser as jest.Mock;
const suggestTransactionCategoryMock = suggestTransactionCategory as jest.Mock;

describe("GET /api/transactions/[id]/suggest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    requireSessionUserMock.mockResolvedValueOnce({ ok: false, error: "UNAUTHORIZED" });

    const response = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid id", async () => {
    requireSessionUserMock.mockResolvedValueOnce({ ok: true, data: { userUuid: "u1" } });

    const response = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "abc" }),
    });
    const body = await parseJson<{ message: string }>(response);

    expect(response.status).toBe(400);
    expect(body.message).toBe("Invalid request");
  });

  it("returns suggestions from service", async () => {
    requireSessionUserMock.mockResolvedValueOnce({ ok: true, data: { userUuid: "u1" } });
    suggestTransactionCategoryMock.mockResolvedValueOnce({
      ok: true,
      data: {
        suggestedCategory: "Food",
        suggestedSubCategory: "Lunch",
      },
    });

    const response = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "4" }),
    });
    const body = await parseJson<{
      suggestedCategory: string | null;
      suggestedSubCategory: string | null;
    }>(response);

    expect(response.status).toBe(200);
    expect(body.suggestedCategory).toBe("Food");
    expect(body.suggestedSubCategory).toBe("Lunch");
  });
});
