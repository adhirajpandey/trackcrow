import { getCategoriesQueryData } from "./queries";

describe("categories queries", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("fetches categories with the browser API client", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: 1,
            uuid: "cat-1",
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

    await expect(getCategoriesQueryData()).resolves.toEqual([
      {
        id: 1,
        uuid: "cat-1",
        name: "Housing",
        subcategories: [],
      },
    ]);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/categories",
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      })
    );
  });
});
