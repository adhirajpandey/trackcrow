jest.mock("@/server/auth/session", () => ({
  requirePageSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/categories/service", () => ({
  listCategoriesForUser: jest.fn(),
}));

jest.mock("@/server/modules/recipients/service", () => ({
  getRecipient: jest.fn(),
  listRecipients: jest.fn(),
}));

jest.mock("@/server/modules/rules/service", () => ({
  getRule: jest.fn(),
  listRules: jest.fn(),
}));

jest.mock("@/lib/prisma-rewrite", () => ({
  __esModule: true,
  default: {
    recipient: { findFirst: jest.fn() },
    category: { findFirst: jest.fn() },
    subcategory: { findFirst: jest.fn() },
  },
}));

import prisma from "@/lib/prisma-rewrite";
import { requirePageSessionUser } from "@/server/auth/session";
import { listCategoriesForUser } from "@/server/modules/categories/service";
import { getRecipient, listRecipients } from "@/server/modules/recipients/service";
import { getRule, listRules } from "@/server/modules/rules/service";

import { getRulesPageData } from "./rules-page-data";

const mockRequirePageSessionUser = jest.mocked(requirePageSessionUser);
const mockListCategoriesForUser = jest.mocked(listCategoriesForUser);
const mockListRecipients = jest.mocked(listRecipients);
const mockGetRule = jest.mocked(getRule);
const mockListRules = jest.mocked(listRules);
const mockGetRecipient = jest.mocked(getRecipient);
const mockFindCategory = jest.mocked(prisma.category.findFirst);
const mockFindSubcategory = jest.mocked(prisma.subcategory.findFirst);

describe("getRulesPageData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequirePageSessionUser.mockResolvedValue({
      userUuid: "user-1",
      name: "Asha",
      email: "asha@example.com",
      image: null,
    });
    mockListRules.mockResolvedValue({
      ok: true,
      data: {
        rules: [],
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    });
    mockListCategoriesForUser.mockResolvedValue({ ok: true, data: [] });
    mockListRecipients.mockResolvedValue({
      ok: true,
      data: {
        recipients: [],
        page: 1,
        pageSize: 100,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    });
    mockGetRule.mockResolvedValue({ ok: false, error: "NOT_FOUND" });
  });

  it("opens create mode with a validated recipient-only prefill", async () => {
    mockGetRecipient.mockResolvedValue({ ok: true, data: {
      uuid: "rcp-cafe", displayName: "Cafe", normalizedName: "cafe", note: null,
      aliases: [], transactionCount: 0, totalAmount: 0,
    } });

    await expect(
      getRulesPageData({ create: "1", recipient: "rcp-cafe" })
    ).resolves.toMatchObject({
      createMode: true,
      recipients: [expect.objectContaining({ uuid: "rcp-cafe", displayName: "Cafe" })],
      initialPrefill: {
        recipientUuid: "rcp-cafe",
        categoryUuid: null,
        subcategoryUuid: null,
      },
    });

    expect(mockGetRecipient).toHaveBeenCalledWith({
      userUuid: "user-1", recipientUuid: "rcp-cafe",
    });
    expect(mockFindCategory).not.toHaveBeenCalled();
    expect(mockFindSubcategory).not.toHaveBeenCalled();
  });

  it("rejects a recipient that is not owned by the current user", async () => {
    mockGetRecipient.mockResolvedValue({ ok: false, error: "NOT_FOUND" });

    await expect(
      getRulesPageData({ create: "1", recipient: "rcp-other-user" })
    ).resolves.toMatchObject({
      createMode: true,
      initialPrefill: null,
    });
  });
});
