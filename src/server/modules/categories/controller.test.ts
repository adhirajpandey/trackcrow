import * as tokenAuth from "@/server/modules/api-tokens/service";
import * as sessionAuth from "@/server/auth/session";
import * as handlers from "./controller";
import * as services from "./service";
jest.mock("@/server/modules/api-tokens/service", () => ({
  resolveApiToken: jest.fn(),
  hasApiTokenScope: (identity: { scopes: string[] }, scope: string) => identity.scopes.includes(scope),
}));
jest.mock("@/server/auth/session", () => ({ requireSessionUser: jest.fn() }));
jest.mock("./service", () => ({
  listCategoriesForUser: jest.fn(),
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
  createSubcategory: jest.fn(),
  updateSubcategory: jest.fn(),
  deleteSubcategory: jest.fn(),
  resetCategoriesToDefault: jest.fn(),
}));

import { ApiTokenScope } from "@/generated/prisma-rewrite";

describe("categories scoped bearer authentication", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(sessionAuth.requireSessionUser).mockResolvedValue({ ok: true, data: { userUuid: "session-user" } });
  });

  const cases = [
    {
      name: "GET /api/categories",
      scope: ApiTokenScope.TRANSACTIONS_READ,
      mock: jest.mocked(services.listCategoriesForUser),
      data: [],
      status: 200,
      invoke: () => {
        const request = new Request("http://localhost/api/categories", { method: "GET", headers: { authorization: "Bearer test-pat" } });
        return handlers.getCategories(request);
      },
    },
    {
      name: "POST /api/categories",
      scope: ApiTokenScope.TRANSACTIONS_WRITE,
      mock: jest.mocked(services.createCategory),
      data: {"uuid": "550e8400-e29b-41d4-a716-446655440000"},
      status: 201,
      invoke: () => {
        const request = new Request("http://localhost/api/categories", { method: "POST", headers: { authorization: "Bearer test-pat" }, body: JSON.stringify({"name": "Food"}) });
        return handlers.postCategory(request);
      },
    },
    {
      name: "PATCH /api/categories/550e8400-e29b-41d4-a716-446655440000",
      scope: ApiTokenScope.TRANSACTIONS_WRITE,
      mock: jest.mocked(services.updateCategory),
      data: {"uuid": "550e8400-e29b-41d4-a716-446655440000"},
      status: 200,
      invoke: () => {
        const request = new Request("http://localhost/api/categories/550e8400-e29b-41d4-a716-446655440000", { method: "PATCH", headers: { authorization: "Bearer test-pat" }, body: JSON.stringify({"name": "Food"}) });
        return handlers.patchCategory(request, { params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }) });
      },
    },
    {
      name: "DELETE /api/categories/550e8400-e29b-41d4-a716-446655440000",
      scope: ApiTokenScope.TRANSACTIONS_WRITE,
      mock: jest.mocked(services.deleteCategory),
      data: {"uuid": "550e8400-e29b-41d4-a716-446655440000"},
      status: 200,
      invoke: () => {
        const request = new Request("http://localhost/api/categories/550e8400-e29b-41d4-a716-446655440000", { method: "DELETE", headers: { authorization: "Bearer test-pat" } });
        return handlers.removeCategory(request, { params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }) });
      },
    },
    {
      name: "POST /api/subcategories",
      scope: ApiTokenScope.TRANSACTIONS_WRITE,
      mock: jest.mocked(services.createSubcategory),
      data: {"uuid": "550e8400-e29b-41d4-a716-446655440000"},
      status: 201,
      invoke: () => {
        const request = new Request("http://localhost/api/subcategories", { method: "POST", headers: { authorization: "Bearer test-pat" }, body: JSON.stringify({"name": "Lunch", "categoryUuid": "550e8400-e29b-41d4-a716-446655440000"}) });
        return handlers.postSubcategory(request);
      },
    },
    {
      name: "PATCH /api/subcategories/550e8400-e29b-41d4-a716-446655440000",
      scope: ApiTokenScope.TRANSACTIONS_WRITE,
      mock: jest.mocked(services.updateSubcategory),
      data: {"uuid": "550e8400-e29b-41d4-a716-446655440000"},
      status: 200,
      invoke: () => {
        const request = new Request("http://localhost/api/subcategories/550e8400-e29b-41d4-a716-446655440000", { method: "PATCH", headers: { authorization: "Bearer test-pat" }, body: JSON.stringify({"name": "Lunch", "categoryUuid": "550e8400-e29b-41d4-a716-446655440000"}) });
        return handlers.patchSubcategory(request, { params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }) });
      },
    },
    {
      name: "DELETE /api/subcategories/550e8400-e29b-41d4-a716-446655440000",
      scope: ApiTokenScope.TRANSACTIONS_WRITE,
      mock: jest.mocked(services.deleteSubcategory),
      data: {"uuid": "550e8400-e29b-41d4-a716-446655440000"},
      status: 200,
      invoke: () => {
        const request = new Request("http://localhost/api/subcategories/550e8400-e29b-41d4-a716-446655440000", { method: "DELETE", headers: { authorization: "Bearer test-pat" } });
        return handlers.removeSubcategory(request, { params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }) });
      },
    },
    {
      name: "POST /api/categories/reset-defaults",
      scope: ApiTokenScope.TRANSACTIONS_WRITE,
      mock: jest.mocked(services.resetCategoriesToDefault),
      data: {"reset": true},
      status: 200,
      invoke: () => {
        const request = new Request("http://localhost/api/categories/reset-defaults", { method: "POST", headers: { authorization: "Bearer test-pat" } });
        return handlers.postResetCategories(request);
      },
    },
  ];

  describe.each(cases)("$name", ({ scope, mock, data, status, invoke }) => {
    it("accepts the required scope and uses the token owner", async () => {
      jest.mocked(tokenAuth.resolveApiToken).mockResolvedValue({ ok: true, data: {
        userUuid: "pat-user", tokenUuid: "token-1", scopes: [scope],
      } });
      // Each handler receives a successful service result; auth stays real.
      (mock as jest.Mock).mockResolvedValue({ ok: true, data });
      expect((await invoke()).status).toBe(status);
      expect(mock).toHaveBeenCalledWith(expect.objectContaining({ userUuid: "pat-user" }));
      expect(tokenAuth.resolveApiToken).toHaveBeenCalledWith("test-pat");
      expect(sessionAuth.requireSessionUser).not.toHaveBeenCalled();
    });

    it("returns 403 for the opposite ledger scope", async () => {
      const wrongScope = scope === ApiTokenScope.TRANSACTIONS_READ
        ? ApiTokenScope.TRANSACTIONS_WRITE : ApiTokenScope.TRANSACTIONS_READ;
      jest.mocked(tokenAuth.resolveApiToken).mockResolvedValue({ ok: true, data: {
        userUuid: "pat-user", tokenUuid: "token-1", scopes: [wrongScope],
      } });
      expect((await invoke()).status).toBe(403);
      expect(mock).not.toHaveBeenCalled();
      expect(sessionAuth.requireSessionUser).not.toHaveBeenCalled();
    });

    it("returns 401 for revoked credentials without session fallback", async () => {
      jest.mocked(tokenAuth.resolveApiToken).mockResolvedValue({ ok: false, error: "UNAUTHORIZED" });
      expect((await invoke()).status).toBe(401);
      expect(mock).not.toHaveBeenCalled();
      expect(sessionAuth.requireSessionUser).not.toHaveBeenCalled();
    });
  });
});
