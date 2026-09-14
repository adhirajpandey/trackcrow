jest.mock("@/server/auth/session", () => ({
  requirePageSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/api-tokens/service", () => ({
  listApiTokens: jest.fn(),
}));

jest.mock("./token-settings", () => ({
  TokenSettings: jest.fn(),
}));

import { requirePageSessionUser } from "@/server/auth/session";
import { listApiTokens } from "@/server/modules/api-tokens/service";

import SettingsPage from "./page";

const requirePageSessionUserMock = jest.mocked(requirePageSessionUser);
const listApiTokensMock = jest.mocked(listApiTokens);

describe("settings page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requirePageSessionUserMock.mockResolvedValue({ userUuid: "user-1" });
  });

  it("propagates token lookup failures", async () => {
    listApiTokensMock.mockResolvedValue({ ok: false, error: "INTERNAL_ERROR", details: undefined });

    await expect(SettingsPage()).rejects.toThrow("Could not load API tokens");
  });

  it("passes through a successful empty token list", async () => {
    listApiTokensMock.mockResolvedValue({ ok: true, data: [] });

    const page = await SettingsPage();

    expect(page.props.initialTokens).toEqual([]);
  });
});
