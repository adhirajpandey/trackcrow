import { POST } from "./route";

import { importSmsTransaction } from "@/server/modules/imports/service";
import {
  makeJsonRequest,
  makeRequest,
  parseJson,
} from "@/test/api-test-helpers";

jest.mock("@/server/modules/imports/service", () => ({
  importSmsTransaction: jest.fn(),
}));

const importSmsTransactionMock = importSmsTransaction as jest.Mock;

describe("POST /api/imports/sms", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 for invalid JSON body", async () => {
    const response = await POST(
      makeRequest("http://localhost/api/imports/sms", {
        method: "POST",
        headers: { authorization: "Token abc", "content-type": "application/json" },
        body: "{bad-json",
      })
    );

    const body = await parseJson<{ message: string }>(response);
    expect(response.status).toBe(400);
    expect(body.message).toBe("Invalid JSON body");
  });

  it("returns 422 when message cannot be parsed", async () => {
    importSmsTransactionMock.mockResolvedValueOnce({
      ok: false,
      error: "UNPROCESSABLE",
      details: { missing: { amount: true, recipient: true } },
    });

    const response = await POST(
      makeJsonRequest(
        "http://localhost/api/imports/sms",
        "POST",
        { data: { message: "unknown format" }, metadata: { location: null } },
        { authorization: "Token abc" }
      )
    );

    const body = await parseJson<{ message: string }>(response);
    expect(response.status).toBe(422);
    expect(body.message).toBe("Unable to extract required fields from message");
  });

  it("returns 201 when transaction is created", async () => {
    importSmsTransactionMock.mockResolvedValueOnce({
      ok: true,
      data: { id: 99, uuid: "txn-uuid" },
    });

    const response = await POST(
      makeJsonRequest(
        "http://localhost/api/imports/sms",
        "POST",
        { data: { message: "sms message" }, metadata: { location: "Bangalore" } },
        { authorization: "Token abc" }
      )
    );

    const body = await parseJson<{ id: number; uuid: string; message: string }>(response);
    expect(response.status).toBe(201);
    expect(body.id).toBe(99);
    expect(body.uuid).toBe("txn-uuid");
  });
});
