jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));

jest.mock("@/server/auth/session", () => ({
  requirePageSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/api-tokens/service", () => ({
  listApiTokens: jest.fn(),
}));

jest.mock("@/server/modules/accounts/service", () => ({
  listAccounts: jest.fn(),
}));

jest.mock("./token-settings", () => ({
  TokenSettings: jest.fn(),
}));

import { headers } from "next/headers";

import { requirePageSessionUser } from "@/server/auth/session";
import { listApiTokens } from "@/server/modules/api-tokens/service";
import { listAccounts } from "@/server/modules/accounts/service";

import SettingsPage from "./page";

const headersMock = jest.mocked(headers);
const requirePageSessionUserMock = jest.mocked(requirePageSessionUser);
const listApiTokensMock = jest.mocked(listApiTokens);
const listAccountsMock = jest.mocked(listAccounts);

describe("settings page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    headersMock.mockResolvedValue(new Headers({
      "x-forwarded-host": "trackcrow.example.com",
      "x-forwarded-proto": "https",
    }) as Awaited<ReturnType<typeof headers>>);
    requirePageSessionUserMock.mockResolvedValue({
      userUuid: "user-1",
      name: null,
      email: null,
      image: null,
    });
    listAccountsMock.mockResolvedValue({ ok: true, data: [] });
  });

  it("propagates token lookup failures", async () => {
    listApiTokensMock.mockResolvedValue({ ok: false, error: "INTERNAL_ERROR", details: undefined });

    await expect(SettingsPage()).rejects.toThrow("Could not load settings");
  });

  it("passes through a successful empty token list", async () => {
    listApiTokensMock.mockResolvedValue({ ok: true, data: [] });

    const page = await SettingsPage();

    expect(page.props.initialTokens).toEqual([]);
    expect(page.props.initialAccounts).toEqual([]);
    expect(page.props.mcpUrl).toBe("https://trackcrow.example.com/mcp");
  });
});
