import { GET } from "./route";

import { requireSessionUser } from "@/server/auth/session";
import { listRecipients } from "@/server/modules/recipients/queries";
import { parseJson } from "@/test/api-test-helpers";

jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/recipients/queries", () => ({
  listRecipients: jest.fn(),
}));

const requireSessionUserMock = requireSessionUser as jest.Mock;
const listRecipientsMock = listRecipients as jest.Mock;

describe("GET /api/recipients", () => {
  it("returns recipients", async () => {
    requireSessionUserMock.mockResolvedValueOnce({ ok: true, data: { userUuid: "u1" } });
    listRecipientsMock.mockResolvedValueOnce({
      ok: true,
      data: [{ id: 1, displayName: "Blinkit", identifiers: [], transactionCount: 10 }],
    });

    const response = await GET();
    const body = await parseJson<Array<{ displayName: string }>>(response);

    expect(response.status).toBe(200);
    expect(body[0]?.displayName).toBe("Blinkit");
  });
});
