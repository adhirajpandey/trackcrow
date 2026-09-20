jest.mock("@/server/auth/session", () => ({ requirePageSessionUser: jest.fn() }));
jest.mock("@/lib/internal-api", () => ({ getCategories: jest.fn() }));
jest.mock("@/server/modules/recipients/service", () => ({ getRecipientDetail: jest.fn() }));
jest.mock("@/app/(app)/recipients/[id]/_components/recipient-detail-model", () => ({
  buildRecipientDetailPageData: jest.fn(() => ({ recipientUuid: "recipient-1" })),
}));
jest.mock("@/lib/prisma-rewrite", () => ({
  __esModule: true,
  default: { rule: { findFirst: jest.fn() } },
}));

import prisma from "@/lib/prisma-rewrite";
import { getCategories } from "@/lib/internal-api";
import { requirePageSessionUser } from "@/server/auth/session";
import { getRecipientDetail } from "@/server/modules/recipients/service";
import { getRecipientDetailPageData } from "./recipient-detail-page-data";

beforeEach(() => {
  jest.mocked(requirePageSessionUser).mockResolvedValue({
    userUuid: "user-1", name: null, email: null, image: null,
  });
  jest.mocked(getCategories).mockResolvedValue([]);
  jest.mocked(getRecipientDetail).mockResolvedValue({ ok: true, data: {} } as never);
});

it("opens an existing recipient rule and scopes the lookup to the current user", async () => {
  jest.mocked(prisma.rule.findFirst).mockResolvedValue({ uuid: "rule-1" } as never);
  expect(await getRecipientDetailPageData("recipient-1")).toMatchObject({
    existingRuleUuid: "rule-1",
  });
  expect(prisma.rule.findFirst).toHaveBeenCalledWith({
    where: { userUuid: "user-1", recipient: { uuid: "recipient-1" }, deletedAt: null },
    orderBy: [{ isEnabled: "desc" }, { updatedAt: "desc" }, { uuid: "asc" }],
    select: { uuid: true },
  });
});

it("allows creation when no saved recipient rule exists", async () => {
  jest.mocked(prisma.rule.findFirst).mockResolvedValue(null);
  expect(await getRecipientDetailPageData("recipient-1")).toMatchObject({
    existingRuleUuid: null,
  });
});
