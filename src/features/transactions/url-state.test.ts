import { updateTransactionsUrl } from "./url-state";

describe("transactions url state", () => {
  const originalWindow = global.window;

  afterEach(() => {
    global.window = originalWindow;
    jest.clearAllMocks();
  });

  it("uses replaceState for replace-mode updates and no-ops on identical hrefs", () => {
    const replaceState = jest.fn();
    const pushState = jest.fn();
    global.window = {
      location: {
        pathname: "/transactions",
        search: "?page=1",
      },
      history: {
        replaceState,
        pushState,
      },
    } as unknown as Window & typeof globalThis;

    updateTransactionsUrl("/transactions?page=2", "replace");
    updateTransactionsUrl("/transactions?page=1", "replace");

    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(replaceState).toHaveBeenCalledWith(null, "", "/transactions?page=2");
    expect(pushState).not.toHaveBeenCalled();
  });

  it("uses pushState for push-mode updates", () => {
    const replaceState = jest.fn();
    const pushState = jest.fn();
    global.window = {
      location: {
        pathname: "/transactions",
        search: "?page=1",
      },
      history: {
        replaceState,
        pushState,
      },
    } as unknown as Window & typeof globalThis;

    updateTransactionsUrl("/transactions?page=3", "push");

    expect(pushState).toHaveBeenCalledWith(null, "", "/transactions?page=3");
    expect(replaceState).not.toHaveBeenCalled();
  });
});
