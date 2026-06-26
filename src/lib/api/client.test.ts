import { ApiClientError, apiGet, apiPost } from "./client";

describe("api client", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("normalizes JSON API errors with backend message fields", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "Invalid request",
          issues: [{ path: ["amount"], message: "Required" }],
        }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        }
      )
    );

    await expect(apiGet("/api/transactions")).rejects.toMatchObject({
      status: 400,
      message: "Invalid request",
      body: {
        message: "Invalid request",
        issues: [{ path: ["amount"], message: "Required" }],
      },
    });
  });

  it("falls back to status text when an error response is not JSON", async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response("nope", { status: 500 }));

    const request = apiGet("/api/dashboard/summary");
    await expect(request).rejects.toBeInstanceOf(ApiClientError);
    await expect(request).rejects.toMatchObject({
      status: 500,
      message: "Request failed with status 500",
      body: null,
    });
  });

  it("sends JSON mutation bodies with included credentials", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    await expect(apiPost<{ ok: boolean }>("/api/transactions", { amount: 10 }))
      .resolves.toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/transactions",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ amount: 10 }),
      })
    );
  });
});
