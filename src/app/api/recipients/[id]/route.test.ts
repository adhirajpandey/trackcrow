import { GET } from "./route";

import { requireSessionUser } from "@/server/auth/session";
import { getRecipient } from "@/server/modules/recipients/queries";
import { parseJson } from "@/test/api-test-helpers";

jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/recipients/queries", () => ({
  getRecipient: jest.fn(),
}));

const requireSessionUserMock = requireSessionUser as jest.Mock;
const getRecipientMock = getRecipient as jest.Mock;

describe("GET /api/recipients/[id]", () => {
  it("returns recipient detail", async () => {
    requireSessionUserMock.mockResolvedValueOnce({ ok: true, data: { userUuid: "u1" } });
    getRecipientMock.mockResolvedValueOnce({
      ok: true,
      data: { id: 1, displayName: "Blinkit", identifiers: [], transactionCount: 10 },
    });

    const response = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "1" }),
    });
    const body = await parseJson<{ id: number }>(response);

    expect(response.status).toBe(200);
    expect(body.id).toBe(1);
  });
});
