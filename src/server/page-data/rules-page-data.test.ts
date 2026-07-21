jest.mock("@/server/auth/session", () => ({
  requirePageSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/categories/service", () => ({
  listCategoriesForUser: jest.fn(),
}));

jest.mock("@/server/modules/recipients/service", () => ({
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
import { listRecipients } from "@/server/modules/recipients/service";
import { getRule, listRules } from "@/server/modules/rules/service";

import { getRulesPageData } from "./rules-page-data";

const mockRequirePageSessionUser = jest.mocked(requirePageSessionUser);
const mockListCategoriesForUser = jest.mocked(listCategoriesForUser);
const mockListRecipients = jest.mocked(listRecipients);
const mockGetRule = jest.mocked(getRule);
const mockListRules = jest.mocked(listRules);
const mockFindRecipient = jest.mocked(prisma.recipient.findFirst);
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
    mockFindRecipient.mockResolvedValue({ uuid: "rcp-cafe" } as never);

    await expect(
      getRulesPageData({ create: "1", recipient: "rcp-cafe" })
    ).resolves.toMatchObject({
      createMode: true,
      initialPrefill: {
        recipientUuid: "rcp-cafe",
        categoryUuid: null,
        subcategoryUuid: null,
      },
    });

    expect(mockFindRecipient).toHaveBeenCalledWith({
      where: { userUuid: "user-1", uuid: "rcp-cafe" },
      select: { uuid: true },
    });
    expect(mockFindCategory).not.toHaveBeenCalled();
    expect(mockFindSubcategory).not.toHaveBeenCalled();
  });

  it("rejects a recipient that is not owned by the current user", async () => {
    mockFindRecipient.mockResolvedValue(null);

    await expect(
      getRulesPageData({ create: "1", recipient: "rcp-other-user" })
    ).resolves.toMatchObject({
      createMode: true,
      initialPrefill: null,
    });
  });
});
