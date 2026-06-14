import { postSmsImport } from "./controller";

import { importSmsTransaction } from "@/server/modules/imports/service";
import { makeJsonRequest, parseJson } from "@/test/api-test-helpers";

jest.mock("@/server/modules/imports/service", () => ({
  importSmsTransaction: jest.fn(),
}));

const importSmsTransactionMock = importSmsTransaction as jest.Mock;

describe("imports controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps unprocessable SMS failures to 422 with the existing message", async () => {
    importSmsTransactionMock.mockResolvedValueOnce({
      ok: false,
      error: "UNPROCESSABLE",
      details: { missing: { amount: true, recipient: true } },
    });

    const response = await postSmsImport(
      makeJsonRequest(
        "http://localhost/api/imports/sms",
        "POST",
        { data: { message: "bad" }, metadata: { location: null } },
        { authorization: "Token abc" }
      )
    );
    const body = await parseJson<{ message: string }>(response);

    expect(response.status).toBe(422);
    expect(body.message).toBe("Unable to extract required fields from message");
  });
});
