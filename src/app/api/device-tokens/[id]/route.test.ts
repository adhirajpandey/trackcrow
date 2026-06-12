import { DELETE } from "./route";

import { requireSessionUser } from "@/server/auth/session";
import { revokeDeviceToken } from "@/server/modules/device-tokens/service";
import { parseJson } from "@/test/api-test-helpers";

jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/device-tokens/service", () => ({
  revokeDeviceToken: jest.fn(),
}));

const requireSessionUserMock = requireSessionUser as jest.Mock;
const revokeDeviceTokenMock = revokeDeviceToken as jest.Mock;

describe("DELETE /api/device-tokens/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 for invalid id", async () => {
    requireSessionUserMock.mockResolvedValueOnce({
      ok: true,
      data: { userUuid: "u1" },
    });

    const response = await DELETE(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "abc" }),
    });
    const body = await parseJson<{ message: string }>(response);

    expect(response.status).toBe(400);
    expect(body.message).toBe("Invalid request");
  });

  it("revokes token", async () => {
    requireSessionUserMock.mockResolvedValueOnce({
      ok: true,
      data: { userUuid: "u1" },
    });
    revokeDeviceTokenMock.mockResolvedValueOnce({
      ok: true,
      data: { revoked: true },
    });

    const response = await DELETE(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "12" }),
    });
    const body = await parseJson<{ revoked: boolean }>(response);

    expect(response.status).toBe(200);
    expect(body.revoked).toBe(true);
  });
});
