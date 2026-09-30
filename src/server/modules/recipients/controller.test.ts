import * as tokenAuth from "@/server/modules/api-tokens/service";
import * as sessionAuth from "@/server/auth/session";
import * as handlers from "./controller";
import * as services from "./service";
jest.mock("@/server/modules/api-tokens/service", () => ({
  resolveApiToken: jest.fn(),
  hasApiTokenScope: (identity: { scopes: string[] }, scope: string) => identity.scopes.includes(scope),
}));
jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("./service", () => ({
  addRecipientAlias: jest.fn(),
  updateRecipient: jest.fn(),
  getRecipientApiDetail: jest.fn(),
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

import { ApiTokenScope } from "@/generated/prisma-rewrite";

describe("recipients scoped bearer authentication", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(sessionAuth.requireSessionUser).mockResolvedValue({ ok: true, data: { userUuid: "session-user" } });
  });

  const cases = [
    {
      name: "GET /api/recipients",
      scope: ApiTokenScope.TRANSACTIONS_READ,
      mock: jest.mocked(services.listRecipients),
      data: {"recipients": []},
      status: 200,
      invoke: () => {
        const request = new Request("http://localhost/api/recipients", { method: "GET", headers: { authorization: "Bearer test-pat" } });
        return handlers.getRecipients(request);
      },
    },
    {
      name: "POST /api/recipients",
      scope: ApiTokenScope.TRANSACTIONS_WRITE,
      mock: jest.mocked(services.createRecipient),
      data: {"uuid": "550e8400-e29b-41d4-a716-446655440000"},
      status: 201,
      invoke: () => {
        const request = new Request("http://localhost/api/recipients", { method: "POST", headers: { authorization: "Bearer test-pat" }, body: JSON.stringify({"displayName": "Merchant"}) });
        return handlers.postRecipient(request);
      },
    },
    {
      name: "GET /api/recipients/550e8400-e29b-41d4-a716-446655440000",
      scope: ApiTokenScope.TRANSACTIONS_READ,
      mock: jest.mocked(services.getRecipient),
      data: {"uuid": "550e8400-e29b-41d4-a716-446655440000"},
      status: 200,
      invoke: () => {
        const request = new Request("http://localhost/api/recipients/550e8400-e29b-41d4-a716-446655440000", { method: "GET", headers: { authorization: "Bearer test-pat" } });
        return handlers.getRecipientById(request, { params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }) });
      },
    },
    {
      name: "GET /api/recipients/550e8400-e29b-41d4-a716-446655440000/detail",
      scope: ApiTokenScope.TRANSACTIONS_READ,
      mock: jest.mocked(services.getRecipientApiDetail),
      data: {"uuid": "550e8400-e29b-41d4-a716-446655440000", "aliases": [], "stats": {"totalAmount": 0}, "existingRuleUuid": null, "dominantCategory": null},
      status: 200,
      invoke: () => {
        const request = new Request("http://localhost/api/recipients/550e8400-e29b-41d4-a716-446655440000/detail", { method: "GET", headers: { authorization: "Bearer test-pat" } });
        return handlers.getRecipientDetailById(request, { params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }) });
      },
    },
    {
      name: "PATCH /api/recipients/550e8400-e29b-41d4-a716-446655440000",
      scope: ApiTokenScope.TRANSACTIONS_WRITE,
      mock: jest.mocked(services.updateRecipient),
      data: {"uuid": "550e8400-e29b-41d4-a716-446655440000"},
      status: 200,
      invoke: () => {
        const request = new Request("http://localhost/api/recipients/550e8400-e29b-41d4-a716-446655440000", { method: "PATCH", headers: { authorization: "Bearer test-pat" }, body: JSON.stringify({"note": "Merchant note"}) });
        return handlers.patchRecipient(request, { params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }) });
      },
    },
    {
      name: "POST /api/recipients/550e8400-e29b-41d4-a716-446655440000/aliases",
      scope: ApiTokenScope.TRANSACTIONS_WRITE,
      mock: jest.mocked(services.addRecipientAlias),
      data: {"status": "created"},
      status: 201,
      invoke: () => {
        const request = new Request("http://localhost/api/recipients/550e8400-e29b-41d4-a716-446655440000/aliases", { method: "POST", headers: { authorization: "Bearer test-pat" }, body: JSON.stringify({"value": "merchant@upi"}) });
        return handlers.postRecipientAlias(request, { params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }) });
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
