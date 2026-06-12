import { GET, POST } from "./route";

import { requireSessionUser } from "@/server/auth/session";
import {
  createDeviceToken,
  listDeviceTokens,
} from "@/server/modules/device-tokens/service";
import { makeJsonRequest, parseJson } from "@/test/api-test-helpers";

jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/device-tokens/service", () => ({
  createDeviceToken: jest.fn(),
  listDeviceTokens: jest.fn(),
}));

const requireSessionUserMock = requireSessionUser as jest.Mock;
const createDeviceTokenMock = createDeviceToken as jest.Mock;
const listDeviceTokensMock = listDeviceTokens as jest.Mock;

describe("GET /api/device-tokens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns tokens", async () => {
    requireSessionUserMock.mockResolvedValueOnce({
      ok: true,
      data: { userUuid: "u1" },
    });
    listDeviceTokensMock.mockResolvedValueOnce({
      ok: true,
      data: [],
    });

    const response = await GET();
    const body = await parseJson<unknown[]>(response);

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });
});

describe("POST /api/device-tokens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 for invalid json", async () => {
    requireSessionUserMock.mockResolvedValueOnce({
      ok: true,
      data: { userUuid: "u1" },
    });

    const response = await POST(
      new Request("http://localhost/api/device-tokens", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{bad-json",
      })
    );

    expect(response.status).toBe(400);
  });

  it("creates a token", async () => {
    requireSessionUserMock.mockResolvedValueOnce({
      ok: true,
      data: { userUuid: "u1" },
    });
    createDeviceTokenMock.mockResolvedValueOnce({
      ok: true,
      data: {
        token: "plaintext-token",
        record: {
          id: 1,
          uuid: "tok-1",
          label: "Phone",
          tokenPrefix: "deadbeef",
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
          revokedAt: null,
        },
      },
    });

    const response = await POST(
      makeJsonRequest("http://localhost/api/device-tokens", "POST", {
        label: "Phone",
      })
    );
    const body = await parseJson<{ token: string }>(response);

    expect(response.status).toBe(201);
    expect(body.token).toBe("plaintext-token");
  });
});
