jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("./service", () => ({
  createDeviceToken: jest.fn(),
  listDeviceTokens: jest.fn(),
  revokeDeviceToken: jest.fn(),
}));

import { requireSessionUser } from "@/server/auth/session";

import { removeDeviceToken } from "./controller";
import { revokeDeviceToken } from "./service";

const requireSessionUserMock = jest.mocked(requireSessionUser);
const revokeDeviceTokenMock = jest.mocked(revokeDeviceToken);

describe("device token controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireSessionUserMock.mockResolvedValue({
      ok: true,
      data: { userUuid: "user-1" },
    });
  });

  it("returns a clean 400 for numeric token route params", async () => {
    const response = await removeDeviceToken(
      new Request("http://localhost/api/device-tokens/123", { method: "DELETE" }),
      { params: Promise.resolve({ id: "123" }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: "Invalid request",
    });
    expect(revokeDeviceTokenMock).not.toHaveBeenCalled();
  });
});
