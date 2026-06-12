import { POST } from "./route";

import { requireSessionUser } from "@/server/auth/session";
import { resetCategoriesToDefault } from "@/server/modules/categories/service";
import { parseJson } from "@/test/api-test-helpers";

jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/categories/service", () => ({
  resetCategoriesToDefault: jest.fn(),
}));

const requireSessionUserMock = requireSessionUser as jest.Mock;
const resetCategoriesToDefaultMock = resetCategoriesToDefault as jest.Mock;

describe("POST /api/categories/reset-defaults", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    requireSessionUserMock.mockResolvedValueOnce({ ok: false, error: "UNAUTHORIZED" });

    const response = await POST();
    expect(response.status).toBe(401);
  });

  it("resets categories", async () => {
    requireSessionUserMock.mockResolvedValueOnce({
      ok: true,
      data: { userUuid: "u1" },
    });
    resetCategoriesToDefaultMock.mockResolvedValueOnce({
      ok: true,
      data: { reset: true },
    });

    const response = await POST();
    const body = await parseJson<{ reset: boolean }>(response);

    expect(response.status).toBe(200);
    expect(body.reset).toBe(true);
  });
});
