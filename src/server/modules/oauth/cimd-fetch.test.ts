jest.mock("node:dns/promises", () => ({ lookup: jest.fn() }));
jest.mock("node:https", () => ({ request: jest.fn() }));

import { lookup } from "node:dns/promises";
import { request } from "node:https";
import { PassThrough } from "node:stream";
import { EventEmitter } from "node:events";
import type { ClientRequest, IncomingMessage, RequestOptions } from "node:http";
import { resolveClientMetadata } from "./cimd";

let sequence = 0;
function client() {
  return `https://client.example/metadata-${sequence++}.json`;
}
let responseBody = "",
  status = 200,
  cacheControl = "max-age=300";
let options: RequestOptions;

describe("CIMD protected fetching", () => {
  beforeEach(() => {
    status = 200;
    cacheControl = "max-age=300";
    jest
      .mocked(lookup)
      .mockResolvedValue([{ address: "8.8.8.8", family: 4 }] as never);
    jest.mocked(request).mockImplementation(((...args: unknown[]) => {
      options = args[1] as RequestOptions;
      const callback = args[2] as (response: IncomingMessage) => void;
      const req = new EventEmitter() as ClientRequest;
      req.end = (() => {
        const res = new PassThrough() as unknown as IncomingMessage;
        res.statusCode = status;
        res.headers = {
          "content-type": "application/json",
          "cache-control": cacheControl,
        };
        callback(res);
        res.push(responseBody);
        res.push(null);
        return req;
      }) as ClientRequest["end"];
      return req;
    }) as typeof request);
  });
  function body(id: string) {
    responseBody = JSON.stringify({
      client_id: id,
      client_name: "Test",
      redirect_uris: ["https://client.example/callback"],
      token_endpoint_auth_method: "none",
    });
  }
  it("pins validated DNS results and caches valid metadata", async () => {
    const id = client();
    body(id);
    await resolveClientMetadata(id);
    const callback = jest.fn();
    options.lookup!("client.example", {}, callback);
    expect(callback).toHaveBeenCalledWith(null, "8.8.8.8", 4);
    expect(options.agent).toBe(false);
    expect(options.signal).toBeDefined();
    await resolveClientMetadata(id);
    expect(request).toHaveBeenCalledTimes(1);
  });
  it("rejects any private DNS answer before connecting", async () => {
    jest.mocked(lookup).mockResolvedValue([
      { address: "8.8.8.8", family: 4 },
      { address: "127.0.0.1", family: 4 },
    ] as never);
    await expect(resolveClientMetadata(client())).rejects.toThrow(
      "invalid_client",
    );
    expect(request).not.toHaveBeenCalled();
  });
  it("blocks redirects and does not cache failures", async () => {
    const id = client();
    body(id);
    status = 302;
    await expect(resolveClientMetadata(id)).rejects.toThrow("invalid_client");
    status = 200;
    await expect(resolveClientMetadata(id)).resolves.toHaveProperty(
      "client_id",
      id,
    );
    expect(request).toHaveBeenCalledTimes(2);
  });
  it("enforces the streaming body limit", async () => {
    responseBody = "x".repeat(65537);
    await expect(resolveClientMetadata(client())).rejects.toThrow(
      "invalid_client",
    );
  });
  it("honors no-store and short cache lifetimes", async () => {
    const id = client();
    body(id);
    cacheControl = "no-store";
    await resolveClientMetadata(id);
    await resolveClientMetadata(id);
    expect(request).toHaveBeenCalledTimes(2);
    cacheControl = "max-age=1";
    await resolveClientMetadata(id);
    const original = Date.now();
    const now = jest.spyOn(Date, "now").mockReturnValue(original + 2000);
    await resolveClientMetadata(id);
    now.mockRestore();
    expect(request).toHaveBeenCalledTimes(4);
  });
  it("aborts a stalled DNS lookup at the deadline", async () => {
    const controller = new AbortController();
    const timeout = jest
      .spyOn(AbortSignal, "timeout")
      .mockReturnValue(controller.signal);
    jest.mocked(lookup).mockReturnValue(new Promise(() => undefined));
    const pending = resolveClientMetadata(client());
    controller.abort();
    await expect(pending).rejects.toThrow("invalid_client");
    timeout.mockRestore();
  });
});
