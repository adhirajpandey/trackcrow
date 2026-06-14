import { DELETE, PATCH } from "./route";

import { requireSessionUser } from "@/server/auth/session";
import {
  deleteCategory,
  updateCategory,
} from "@/server/modules/categories/service";
import { makeJsonRequest, parseJson } from "@/test/api-test-helpers";

jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/categories/service", () => ({
  deleteCategory: jest.fn(),
  updateCategory: jest.fn(),
}));

const requireSessionUserMock = requireSessionUser as jest.Mock;
const updateCategoryMock = updateCategory as jest.Mock;
const deleteCategoryMock = deleteCategory as jest.Mock;

describe("PATCH /api/categories/[id]", () => {
  it("updates category", async () => {
    requireSessionUserMock.mockResolvedValueOnce({ ok: true, data: { userUuid: "u1" } });
    updateCategoryMock.mockResolvedValueOnce({ ok: true, data: { id: 1, uuid: "cat-1" } });

    const response = await PATCH(
      makeJsonRequest("http://localhost", "PATCH", { name: "Food" }),
      { params: Promise.resolve({ id: "1" }) }
    );
    const body = await parseJson<{ id: number }>(response);

    expect(response.status).toBe(200);
    expect(body.id).toBe(1);
  });
});

describe("DELETE /api/categories/[id]", () => {
  it("deletes category", async () => {
    requireSessionUserMock.mockResolvedValueOnce({ ok: true, data: { userUuid: "u1" } });
    deleteCategoryMock.mockResolvedValueOnce({ ok: true, data: { id: 1 } });

    const response = await DELETE(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "1" }),
    });
    const body = await parseJson<{ id: number }>(response);

    expect(response.status).toBe(200);
    expect(body.id).toBe(1);
  });
});
