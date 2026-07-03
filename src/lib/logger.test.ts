jest.unmock("@/lib/logger");

describe("logger", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("keeps structured error details and request context intact", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { createRequestContext, logger, withRequestContext } = await import("./logger");

    withRequestContext(
      createRequestContext({
        requestId: "req-123",
        method: "POST",
        path: "/api/test",
      }),
      () => {
        logger.error(
          {
            event: "test.failed",
            message: "Request failed",
            token: "secret-token",
          },
          new Error("boom")
        );
      }
    );

    expect(errorSpy).toHaveBeenCalledTimes(1);

    const payload = JSON.parse(errorSpy.mock.calls[0][0] as string);
    expect(payload).toMatchObject({
      level: "error",
      event: "test.failed",
      message: "Request failed",
      requestId: "req-123",
      method: "POST",
      path: "/api/test",
      token: "[REDACTED]",
    });
    expect(payload.error).toMatchObject({
      name: "Error",
      message: "boom",
    });
  });
});
