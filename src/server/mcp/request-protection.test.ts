jest.mock("@/server/modules/api-tokens/service", () => ({ resolveApiToken: jest.fn() }));
jest.mock("@/server/modules/oauth/service", () => ({ resolveOAuthAccessToken: jest.fn() }));

import { resolveApiToken } from "@/server/modules/api-tokens/service";
import { resolveOAuthAccessToken } from "@/server/modules/oauth/service";
import type { RateLimiter, RateLimitResult } from "@/server/rate-limit/types";

import { enforceMcpBodyLimit, protectMcpRequest } from "./request-protection";

const resolveApiTokenMock = jest.mocked(resolveApiToken);

class FakeLimiter implements RateLimiter {
  counts = new Map<string, number>();
  fail = false;
  async consume(key: string, limit: number): Promise<RateLimitResult> {
    if (this.fail) throw new Error("storage down");
    const count = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, count);
    return { allowed: count <= limit, remaining: Math.max(0, limit - count), resetAt: new Date(Date.now() + 60_000) };
  }
  async check(key: string, limit: number): Promise<RateLimitResult> {
    if (this.fail) throw new Error("storage down");
    const count = this.counts.get(key) ?? 0;
    return { allowed: count < limit, remaining: Math.max(0, limit - count), resetAt: new Date(Date.now() + 60_000) };
  }
}

describe("MCP request protection", () => {
  beforeEach(() => jest.clearAllMocks());

  it("uses the connection budget only after OAuth token authentication", async () => {
    const limiter = new FakeLimiter();
    process.env.OAUTH_ISSUER_URL = "https://trackcrow.example";
    jest.mocked(resolveOAuthAccessToken).mockResolvedValueOnce({ ok: true, data: { userUuid: "user", tokenUuid: "access-1", connectionUuid: "connection", scopes: [] } });
    const request = new Request("https://trackcrow.example/mcp", { method: "POST", headers: { authorization: "Bearer tc_at_valid" } });
    expect((await protectMcpRequest(request, limiter)).ok).toBe(true);
    expect(limiter.counts.get("mcp:connection:connection")).toBe(1);
    expect(limiter.counts.has("mcp:token:access-1")).toBe(false);
    jest.mocked(resolveOAuthAccessToken).mockResolvedValueOnce({ ok: false, error: "UNAUTHORIZED" });
    const invalid = await protectMcpRequest(request, limiter);
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.response.status).toBe(401);
      expect(invalid.response.headers.get("www-authenticate")).toContain("https://trackcrow.example/.well-known/oauth-protected-resource/mcp");
    }
    expect(limiter.counts.get("mcp:connection:connection")).toBe(1);
    expect([...limiter.counts.keys()].filter((key) => key.startsWith("mcp:auth-failure:"))).toHaveLength(1);
  });

  it("counts only invalid credentials against the IP budget", async () => {
    const limiter = new FakeLimiter();
    resolveApiTokenMock.mockResolvedValue({ ok: true, data: { userUuid: "user", tokenUuid: "token", scopes: [] } });
    const valid = await protectMcpRequest(new Request("http://localhost/mcp", { method: "POST", headers: { authorization: "Bearer valid", "x-real-ip": "1.2.3.4" } }), limiter);
    expect(valid.ok).toBe(true);
    expect([...limiter.counts.keys()].some((key) => key.startsWith("mcp:auth-failure:"))).toBe(false);

    resolveApiTokenMock.mockResolvedValue({ ok: false, error: "UNAUTHORIZED" });
    const invalid = await protectMcpRequest(new Request("http://localhost/mcp", { method: "POST", headers: { authorization: "Bearer invalid", "x-real-ip": "1.2.3.4" } }), limiter);
    expect(invalid.ok).toBe(false);
    expect([...limiter.counts.keys()].some((key) => key.startsWith("mcp:auth-failure:"))).toBe(true);
  });

  it("returns 429 with Retry-After after ten invalid attempts", async () => {
    const limiter = new FakeLimiter();
    const request = new Request("http://localhost/mcp", { method: "POST", headers: { "x-real-ip": "1.2.3.4" } });
    for (let attempt = 0; attempt < 10; attempt += 1) await protectMcpRequest(request.clone(), limiter);
    const blocked = await protectMcpRequest(request.clone(), limiter);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.response.status).toBe(429);
      expect(blocked.response.headers.get("retry-after")).toBeTruthy();
    }
  });

  it("fails closed when limiter storage fails", async () => {
    const limiter = new FakeLimiter();
    limiter.fail = true;
    const result = await protectMcpRequest(new Request("http://localhost/mcp", { method: "POST" }), limiter);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(503);
  });

  it("limits streamed bodies without Content-Length", async () => {
    const tooLarge = new Request("http://localhost/mcp", { method: "POST", body: new Uint8Array(65 * 1024), duplex: "half" } as RequestInit);
    expect(await enforceMcpBodyLimit(tooLarge)).toBeNull();
    const accepted = new Request("http://localhost/mcp", { method: "POST", body: "{}" });
    expect(await enforceMcpBodyLimit(accepted)).toBeInstanceOf(Request);
  });
});
