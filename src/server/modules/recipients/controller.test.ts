jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("./service", () => ({
  addRecipientIdentifier: jest.fn(),
  createRecipient: jest.fn(),
  getRecipient: jest.fn(),
  listRecipients: jest.fn(),
}));

import { requireSessionUser } from "@/server/auth/session";

import { getRecipientById, getRecipients, postRecipient } from "./controller";
import { createRecipient, getRecipient, listRecipients } from "./service";

const requireSessionUserMock = jest.mocked(requireSessionUser);
const getRecipientMock = jest.mocked(getRecipient);
const listRecipientsMock = jest.mocked(listRecipients);
const createRecipientMock = jest.mocked(createRecipient);

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
        "http://localhost/api/recipients?q=merchant&page=2&size=10&sortBy=transactionCount&sortOrder=desc&minTransactionCount=2&maxTransactionCount=10&minTotalAmount=99.5&maxTotalAmount=5000"
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
      minTransactionCount: 2,
      maxTransactionCount: 10,
      minTotalAmount: 99.5,
      maxTotalAmount: 5000,
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

  it("rejects inverted recipient aggregate ranges", async () => {
    const response = await getRecipients(
      new Request(
        "http://localhost/api/recipients?minTransactionCount=5&maxTransactionCount=2"
      )
    );

    expect(response.status).toBe(400);
    expect(listRecipientsMock).not.toHaveBeenCalled();
  });

  it("creates a recipient for the authenticated user", async () => {
    createRecipientMock.mockResolvedValueOnce({
      ok: true,
      data: {
        uuid: "rcp-7",
        displayName: "Uber India",
        normalizedName: "uber india",
      },
    });

    const response = await postRecipient(
      new Request("http://localhost/api/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "Uber India" }),
      })
    );

    expect(response.status).toBe(201);
    expect(createRecipientMock).toHaveBeenCalledWith({
      userUuid: "user-1",
      displayName: "Uber India",
    });
  });

  it("returns matching recipient details on create conflict", async () => {
    createRecipientMock.mockResolvedValueOnce({
      ok: false,
      error: "CONFLICT",
      details: {
        existingRecipient: { uuid: "rcp-7", displayName: "Uber India" },
      },
    });

    const response = await postRecipient(
      new Request("http://localhost/api/recipients", {
        method: "POST",
        body: JSON.stringify({ displayName: "Uber India" }),
      })
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      details: {
        existingRecipient: { uuid: "rcp-7", displayName: "Uber India" },
      },
    });
  });

  it("returns a clean 400 for numeric recipient route params", async () => {
    const response = await getRecipientById(
      new Request("http://localhost/api/recipients/123"),
      { params: Promise.resolve({ id: "123" }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: "Invalid request",
    });
    expect(getRecipientMock).not.toHaveBeenCalled();
  });
});
