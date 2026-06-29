jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("./service", () => ({
  getRecipient: jest.fn(),
  listRecipients: jest.fn(),
}));

import { requireSessionUser } from "@/server/auth/session";

import { getRecipients } from "./controller";
import { listRecipients } from "./service";

const requireSessionUserMock = jest.mocked(requireSessionUser);
const listRecipientsMock = jest.mocked(listRecipients);

describe("recipients controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireSessionUserMock.mockResolvedValue({
      ok: true,
      data: { userUuid: "user-1" },
    });
  });

  it("parses recipient list query params and returns paginated data", async () => {
    listRecipientsMock.mockResolvedValueOnce({
      ok: true,
      data: {
        recipients: [],
        page: 2,
        pageSize: 10,
        total: 11,
        totalPages: 2,
        hasNext: false,
        hasPrev: true,
      },
    });

    const response = await getRecipients(
      new Request(
        "http://localhost/api/recipients?q=merchant&page=2&size=10&sortBy=transactionCount&sortOrder=desc"
      )
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      recipients: [],
      page: 2,
      pageSize: 10,
      total: 11,
      totalPages: 2,
      hasNext: false,
      hasPrev: true,
    });
    expect(listRecipientsMock).toHaveBeenCalledWith({
      userUuid: "user-1",
      q: "merchant",
      page: 2,
      size: 10,
      sortBy: "transactionCount",
      sortOrder: "desc",
    });
  });

  it("rejects malformed list query params", async () => {
    const response = await getRecipients(
      new Request("http://localhost/api/recipients?page=0&sortOrder=down")
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: "Invalid request",
      issues: expect.any(Array),
    });
  });
});
