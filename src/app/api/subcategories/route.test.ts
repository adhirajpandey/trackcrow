import { POST } from "./route";

import { requireSessionUser } from "@/server/auth/session";
import { createSubcategory } from "@/server/modules/categories/service";
import { makeJsonRequest, parseJson } from "@/test/api-test-helpers";

jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/categories/service", () => ({
  createSubcategory: jest.fn(),
}));

const requireSessionUserMock = requireSessionUser as jest.Mock;
const createSubcategoryMock = createSubcategory as jest.Mock;

describe("POST /api/subcategories", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 for invalid json", async () => {
    requireSessionUserMock.mockResolvedValueOnce({
      ok: true,
      data: { userUuid: "u1" },
    });

    const response = await POST(
      new Request("http://localhost/api/subcategories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{bad-json",
      })
    );

    expect(response.status).toBe(400);
  });

  it("creates a subcategory", async () => {
    requireSessionUserMock.mockResolvedValueOnce({
      ok: true,
      data: { userUuid: "u1" },
    });
    createSubcategoryMock.mockResolvedValueOnce({
      ok: true,
      data: { id: 10, uuid: "sub-1" },
    });

    const response = await POST(
      makeJsonRequest("http://localhost/api/subcategories", "POST", {
        name: "Lunch",
        categoryId: 1,
      })
    );
    const body = await parseJson<{ id: number }>(response);

    expect(response.status).toBe(201);
    expect(body.id).toBe(10);
  });
});
