import { ApiClientError } from "@/lib/api/client";

import { getTransactionsPageState, isSameTransactionsQuery } from "./query-state";
import { getTransactionsQueryData } from "./queries";

describe("transactions queries", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("fetches transactions page query data using the browser API client", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            transactions: [
              {
                id: 1,
                uuid: "txn-1",
                userUuid: "user-1",
                amount: 2500,
                currency: "INR",
                type: "UPI",
                source: "MANUAL",
                recipientRaw: "ACME RENT",
                recipientName: "Acme Rent",
                recipientDisplayName: "Acme Rent",
                reference: null,
                accountLabel: null,
                remarks: null,
                locationRaw: null,
                timestamp: "2026-06-10T10:00:00.000Z",
                createdAt: "2026-06-10T10:00:00.000Z",
                updatedAt: "2026-06-10T10:00:00.000Z",
                category: "Housing",
                subcategory: null,
                categoryId: 12,
                subcategoryId: null,
              },
            ],
            page: 1,
            pageSize: 10,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
            firstTxnDate: "2026-06-10T10:00:00.000Z",
            lastTxnDate: "2026-06-10T10:00:00.000Z",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: 12,
              uuid: "cat-12",
              name: "Housing",
              subcategories: [],
            },
          ]),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          }
        )
      );

    const state = getTransactionsPageState({
      range: "all-time",
      transaction: "txn-1",
      sortBy: "amount",
      sortOrder: "asc",
      category: "Housing",
    });
    const data = await getTransactionsQueryData(state.query);

    expect(data.rows).toEqual([
      expect.objectContaining({
        uuid: "txn-1",
        recipient: "Acme Rent",
        category: "Housing",
      }),
    ]);
    expect(data.pagination).toMatchObject({
      page: 1,
      pageSize: 10,
    });
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "/api/transactions?category=Housing&page=1&size=10&sortBy=amount&sortOrder=asc",
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      })
    );
  });

  it("surfaces ApiClientError when the browser request fails", async () => {
    global.fetch = jest.fn().mockImplementation(async () =>
      new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      })
    );

    const state = getTransactionsPageState({ range: "all-time" });
    const request = getTransactionsQueryData(state.query);

    await expect(request).rejects.toBeInstanceOf(ApiClientError);
    await expect(request).rejects.toMatchObject({
      status: 401,
      message: "Unauthorized",
    });
  });

  it("normalizes category ordering before comparing initial queries", () => {
    const initial = getTransactionsPageState({
      range: "all-time",
      category: ["Travel", "Food"],
    }).query;
    const current = getTransactionsPageState({
      range: "all-time",
      category: "Food,Travel",
    }).query;

    expect(isSameTransactionsQuery(initial, current)).toBe(true);
  });
});
