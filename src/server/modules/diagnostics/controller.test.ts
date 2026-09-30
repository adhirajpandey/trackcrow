jest.mock("@/server/modules/api-tokens/service", () => ({
  resolveApiToken: jest.fn(),
}));
jest.mock("./service", () => ({ saveDiagnosticReport: jest.fn() }));

import { resolveApiToken } from "@/server/modules/api-tokens/service";
import { saveDiagnosticReport } from "./service";
import { MAX_DIAGNOSTIC_BYTES, postMobileDiagnostics } from "./controller";

const payload = {
  kind: "report",
  appVersion: "0.1.0",
  versionCode: 3,
  device: { androidVersion: "16" },
  entries: [{ event: "sms.config.fetch.304" }],
};
function request(
  body: string = JSON.stringify(payload),
  auth: string | null = "Bearer valid",
  headers: Record<string, string> = {},
) {
  return new Request("http://localhost/api/mobile/diagnostics", {
    method: "POST",
    body,
    headers: { ...headers, ...(auth ? { Authorization: auth } : {}) },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(resolveApiToken)
    .mockResolvedValue({
      ok: true,
      data: { userUuid: "user-1", tokenUuid: "token-1", scopes: [] },
    });
  jest
    .mocked(saveDiagnosticReport)
    .mockResolvedValue({ status: "created", uuid: "report-1" });
});

it("accepts a bearer token regardless of scope and derives ownership from it", async () => {
  const response = await postMobileDiagnostics(request());
  expect(response.status).toBe(201);
  expect(await response.json()).toEqual({ uuid: "report-1" });
  expect(saveDiagnosticReport).toHaveBeenCalledWith("user-1", payload);
});

it.each([null, "Token valid", "Bearer", "Basic valid"])(
  "rejects missing or malformed bearer authorization %s",
  async (auth) => {
    expect((await postMobileDiagnostics(request(undefined, auth))).status).toBe(
      401,
    );
    expect(saveDiagnosticReport).not.toHaveBeenCalled();
  },
);

it("rejects revoked tokens and preserves auth service failures", async () => {
  jest
    .mocked(resolveApiToken)
    .mockResolvedValue({ ok: false, error: "UNAUTHORIZED" });
  expect((await postMobileDiagnostics(request())).status).toBe(401);
  jest
    .mocked(resolveApiToken)
    .mockResolvedValue({ ok: false, error: "SERVICE_UNAVAILABLE" });
  expect((await postMobileDiagnostics(request())).status).toBe(503);
});

it("enforces actual UTF-8 bytes even without a trustworthy Content-Length", async () => {
  const body = JSON.stringify({
    ...payload,
    note: "₹".repeat(MAX_DIAGNOSTIC_BYTES / 3),
  });
  expect((await postMobileDiagnostics(request(body))).status).toBe(413);
  expect(
    (
      await postMobileDiagnostics(
        request(body, "Bearer valid", { "Content-Length": "1" }),
      )
    ).status,
  ).toBe(413);
  expect(saveDiagnosticReport).not.toHaveBeenCalled();
});

it("rejects advertised oversized bodies before parsing", async () => {
  expect(
    (
      await postMobileDiagnostics(
        request("{}", "Bearer valid", {
          "Content-Length": String(MAX_DIAGNOSTIC_BYTES + 1),
        }),
      )
    ).status,
  ).toBe(413);
});

it("accepts exactly 256 KB and rejects one byte more, across stream chunks", async () => {
  const base = JSON.stringify({ ...payload, entries: [{ padding: "" }] });
  const body = JSON.stringify({
    ...payload,
    entries: [
      { padding: "a".repeat(MAX_DIAGNOSTIC_BYTES - Buffer.byteLength(base)) },
    ],
  });
  expect(Buffer.byteLength(body)).toBe(MAX_DIAGNOSTIC_BYTES);
  expect((await postMobileDiagnostics(request(body))).status).toBe(201);
  const bytes = new TextEncoder().encode(body + " ");
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(bytes.slice(0, 100));
      controller.enqueue(bytes.slice(100));
      controller.close();
    },
  });
  const streamed = new Request("http://localhost/api/mobile/diagnostics", {
    method: "POST",
    headers: { Authorization: "Bearer valid" },
    body: stream,
    duplex: "half",
  } as RequestInit);
  expect((await postMobileDiagnostics(streamed)).status).toBe(413);
});

it.each([
  "{",
  JSON.stringify({ ...payload, kind: "other" }),
  JSON.stringify({ ...payload, userUuid: "other" }),
  JSON.stringify({ ...payload, versionCode: -1 }),
])("rejects invalid reports", async (body) => {
  expect((await postMobileDiagnostics(request(body))).status).toBe(400);
  expect(saveDiagnosticReport).not.toHaveBeenCalled();
});

it("returns 429 and Retry-After when the shared daily limit is exhausted", async () => {
  jest
    .mocked(saveDiagnosticReport)
    .mockResolvedValue({
      status: "limited",
      resetAt: new Date(Date.now() + 60000),
    });
  const response = await postMobileDiagnostics(request());
  expect(response.status).toBe(429);
  expect(Number(response.headers.get("retry-after"))).toBeGreaterThan(0);
});

it("sanitizes persistence failures", async () => {
  jest
    .mocked(saveDiagnosticReport)
    .mockRejectedValue(new Error("private report"));
  const response = await postMobileDiagnostics(request());
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain("private report");
});
