import { ApiClientError } from "@/lib/api/client";

import { getRecipientsPageState } from "./query-state";
import { getRecipientsQueryData } from "./queries";

describe("recipients queries", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("fetches recipients page query data using the browser API client", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          recipients: [
            {
              id: 1,
              uuid: "rcp-1",
              displayName: "Biraj Borah",
              normalizedName: "biraj borah",
              transactionCount: 19,
              identifiers: [
                {
                  id: 11,
                  uuid: "rid-11",
                  kind: "UPI_ID",
                  value: "biraj@oksbi",
                  normalizedValue: "biraj@oksbi",
                },
              ],
            },
          ],
          page: 2,
          pageSize: 10,
          total: 11,
          totalPages: 2,
          hasNext: false,
          hasPrev: true,
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        }
      )
    );

    const state = getRecipientsPageState({
      q: "merchant",
      page: "2",
      sortBy: "transactionCount",
      sortOrder: "desc",
    });
    const data = await getRecipientsQueryData(state.query);

    expect(data.recipients).toEqual([
      expect.objectContaining({
        uuid: "rcp-1",
        displayName: "Biraj Borah",
      }),
    ]);
    expect(data.pagination).toMatchObject({
      page: 2,
      pageSize: 10,
      total: 11,
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/recipients?q=merchant&page=2&size=10&sortBy=transactionCount&sortOrder=desc",
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

    const state = getRecipientsPageState({});
    const request = getRecipientsQueryData(state.query);

    await expect(request).rejects.toBeInstanceOf(ApiClientError);
    await expect(request).rejects.toMatchObject({
      status: 401,
      message: "Unauthorized",
    });
  });
});
