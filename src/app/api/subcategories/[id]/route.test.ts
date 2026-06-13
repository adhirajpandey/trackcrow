import { DELETE, PATCH } from "./route";

import { requireSessionUser } from "@/server/auth/session";
import {
  deleteSubcategory,
  updateSubcategory,
} from "@/server/modules/categories/mutations";
import { makeJsonRequest, parseJson } from "@/test/api-test-helpers";

jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/categories/mutations", () => ({
  deleteSubcategory: jest.fn(),
  updateSubcategory: jest.fn(),
}));

const requireSessionUserMock = requireSessionUser as jest.Mock;
const deleteSubcategoryMock = deleteSubcategory as jest.Mock;
const updateSubcategoryMock = updateSubcategory as jest.Mock;

describe("PATCH /api/subcategories/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 for invalid id", async () => {
    requireSessionUserMock.mockResolvedValueOnce({
      ok: true,
      data: { userUuid: "u1" },
    });

    const response = await PATCH(
      makeJsonRequest("http://localhost/api/subcategories/bad", "PATCH", {
        name: "Lunch",
        categoryId: 1,
      }),
      { params: Promise.resolve({ id: "bad" }) }
    );

    expect(response.status).toBe(400);
  });

  it("updates a subcategory", async () => {
    requireSessionUserMock.mockResolvedValueOnce({
      ok: true,
      data: { userUuid: "u1" },
    });
    updateSubcategoryMock.mockResolvedValueOnce({
      ok: true,
      data: { id: 10, uuid: "sub-1" },
    });

    const response = await PATCH(
      makeJsonRequest("http://localhost/api/subcategories/10", "PATCH", {
        name: "Lunch",
        categoryId: 1,
      }),
      { params: Promise.resolve({ id: "10" }) }
    );
    const body = await parseJson<{ id: number }>(response);

    expect(response.status).toBe(200);
    expect(body.id).toBe(10);
  });
});

describe("DELETE /api/subcategories/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes a subcategory", async () => {
    requireSessionUserMock.mockResolvedValueOnce({
      ok: true,
      data: { userUuid: "u1" },
    });
    deleteSubcategoryMock.mockResolvedValueOnce({
      ok: true,
      data: { id: 10 },
    });

    const response = await DELETE(
      new Request("http://localhost/api/subcategories/10", { method: "DELETE" }),
      { params: Promise.resolve({ id: "10" }) }
    );
    const body = await parseJson<{ id: number }>(response);

    expect(response.status).toBe(200);
    expect(body.id).toBe(10);
  });
});
