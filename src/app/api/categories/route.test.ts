import { GET } from "./route";

import { requireSessionUser } from "@/server/auth/session";
import { listCategoriesForUser } from "@/server/modules/categories/service";
import { parseJson } from "@/test/api-test-helpers";

jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/categories/service", () => ({
  listCategoriesForUser: jest.fn(),
}));

const requireSessionUserMock = requireSessionUser as jest.Mock;
const listCategoriesForUserMock = listCategoriesForUser as jest.Mock;

describe("GET /api/categories", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    requireSessionUserMock.mockResolvedValueOnce({ ok: false, error: "UNAUTHORIZED" });

    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("returns category payload", async () => {
    requireSessionUserMock.mockResolvedValueOnce({
      ok: true,
      data: { userUuid: "u1" },
    });
    listCategoriesForUserMock.mockResolvedValueOnce({
      ok: true,
      data: [
        {
          id: 1,
          uuid: "cat-1",
          name: "Food",
          subcategories: [{ id: 10, uuid: "sub-1", name: "Lunch" }],
        },
      ],
    });

    const response = await GET();
    const body = await parseJson<Array<{ name: string }>>(response);

    expect(response.status).toBe(200);
    expect(body[0]?.name).toBe("Food");
  });
});
