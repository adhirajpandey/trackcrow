import { GET } from "./route";

import { requireSessionUser } from "@/server/auth/session";
import { getMe } from "@/server/modules/users/service";
import { parseJson } from "@/test/api-test-helpers";

jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/users/service", () => ({
  getMe: jest.fn(),
}));

const requireSessionUserMock = requireSessionUser as jest.Mock;
const getMeMock = getMe as jest.Mock;

describe("GET /api/me", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    requireSessionUserMock.mockResolvedValueOnce({ ok: false, error: "UNAUTHORIZED" });

    const response = await GET();
    const body = await parseJson<{ message: string }>(response);

    expect(response.status).toBe(401);
    expect(body.message).toBe("Unauthorized");
  });

  it("returns current user payload", async () => {
    requireSessionUserMock.mockResolvedValueOnce({
      ok: true,
      data: { userUuid: "u1" },
    });
    getMeMock.mockResolvedValueOnce({
      ok: true,
      data: {
        uuid: "u1",
        id: 1,
        email: "user@example.com",
        name: "User",
        image: null,
        subscription: 0,
      },
    });

    const response = await GET();
    const body = await parseJson<{ uuid: string; email: string }>(response);

    expect(response.status).toBe(200);
    expect(body.uuid).toBe("u1");
    expect(body.email).toBe("user@example.com");
  });
});
