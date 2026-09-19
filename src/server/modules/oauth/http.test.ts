import { logger } from "@/lib/logger";
import { oauthClientIp, oauthFailure } from "./http";

describe("OAuth HTTP helpers", () => {
  it("prefers the deployment-provided client IP and trims its first value", () => {
    const request = new Request("https://trackcrow.example/oauth/authorize", {
      headers: {
        "x-vercel-forwarded-for": " 203.0.113.10, 198.51.100.4 ",
        "x-real-ip": "192.0.2.8",
      },
    });

    expect(oauthClientIp(request)).toBe("203.0.113.10");
  });

  it("does not trust a generic forwarded-for header", () => {
    const request = new Request("https://trackcrow.example/oauth/authorize", {
      headers: { "x-forwarded-for": "203.0.113.10" },
    });

    expect(oauthClientIp(request)).toBe("unknown");
  });

  it("uses the existing real-IP fallback when deployment metadata is absent", () => {
    const request = new Request("https://trackcrow.example/oauth/authorize", {
      headers: { "x-real-ip": " 192.0.2.8 " },
    });

    expect(oauthClientIp(request)).toBe("192.0.2.8");
  });

  it("logs unexpected failures and returns a temporary error", async () => {
    const error = new Error("database unavailable");

    const response = oauthFailure(error);

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "temporarily_unavailable",
    });
    expect(logger.error).toHaveBeenCalledWith(
      { event: "oauth.request.failed" },
      error,
    );
  });
});
