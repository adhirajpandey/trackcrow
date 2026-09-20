jest.mock("@/lib/prisma-rewrite", () => ({
  __esModule: true,
  default: ((globalThis as any).__rulesPrismaMock = {
    rule: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    recipient: { findFirst: jest.fn() },
    category: { findFirst: jest.fn() },
    subcategory: { findFirst: jest.fn() },
  }),
}));

import { RuleActionStatus, RuleActionType } from "@/generated/prisma-rewrite";

import { createRule, deleteRule, listRules, loadEvaluatableRules, updateRule } from "./service";

const prisma = (globalThis as any).__rulesPrismaMock;
const input = {
  userUuid: "user-1",
  name: "Groceries",
  isEnabled: true,
  conditions: { recipient: { equals: "7a4bfec7-f109-4d37-bf9b-41f909f25dad" } },
  action: {
    categoryUuid: "5ac11b5c-f9af-41e6-a621-bd085836338e",
    subcategoryUuid: null,
  },
};

describe("rule service lifecycle", () => {
  beforeEach(() => jest.clearAllMocks());

  it("uses deterministic list ordering and mutually exclusive statuses", async () => {
    prisma.rule.count.mockResolvedValue(0);
    prisma.rule.findMany.mockResolvedValue([]);
    await listRules({ userUuid: "user-1", status: "disabled" });
    expect(prisma.rule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isEnabled: false,
          actionStatus: RuleActionStatus.VALID,
          deletedAt: null,
        }),
        orderBy: [{ isEnabled: "desc" }, { updatedAt: "desc" }, { uuid: "asc" }],
      })
    );
  });

  it("returns the existing rule when an enabled recipient overlaps", async () => {
    prisma.recipient.findFirst.mockResolvedValue({ id: 2 });
    prisma.category.findFirst.mockResolvedValue({ id: 3 });
    prisma.rule.findFirst.mockResolvedValue({ uuid: "existing", name: "Existing" });
    await expect(createRule(input)).resolves.toEqual({
      ok: false,
      error: "RULE_RECIPIENT_CONFLICT",
      details: { existingRule: { uuid: "existing", name: "Existing" } },
    });
    expect(prisma.rule.create).not.toHaveBeenCalled();
  });

  it("allows editing a broken rule name while it remains disabled", async () => {
    prisma.rule.findFirst.mockResolvedValueOnce({
        id: 9,
        uuid: "rule-9",
        name: "Old",
        isEnabled: false,
        actionStatus: RuleActionStatus.NEEDS_REPAIR,
        recipientId: 2,
        categoryId: null,
        subcategoryId: null,
      });
    prisma.rule.update.mockResolvedValue({
      uuid: "rule-9",
      name: "New",
      isEnabled: false,
      actionStatus: RuleActionStatus.NEEDS_REPAIR,
      recipient: { uuid: "r", displayName: "R" },
      category: null,
      subcategory: null,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    });
    await expect(
      updateRule({ userUuid: "user-1", ruleUuid: "rule-9", name: "New" })
    ).resolves.toMatchObject({ ok: true, data: { name: "New" } });
  });

  it("creates an IGNORE rule without touching categories", async () => {
    prisma.recipient.findFirst.mockResolvedValue({ id: 2 });
    prisma.rule.findFirst.mockResolvedValue(null);
    prisma.rule.create.mockResolvedValue({
      uuid: "rule-ignore",
      name: "Me",
      isEnabled: true,
      actionStatus: RuleActionStatus.VALID,
      actionType: RuleActionType.IGNORE,
      recipient: { uuid: "r", displayName: "Me" },
      category: null,
      subcategory: null,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    });

    const result = await createRule({ ...input, name: "Me", action: { type: "IGNORE" } });

    expect(prisma.category.findFirst).not.toHaveBeenCalled();
    expect(prisma.rule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actionType: RuleActionType.IGNORE,
          categoryId: null,
          subcategoryId: null,
        }),
      })
    );
    expect(result).toMatchObject({
      ok: true,
      data: { action: { type: RuleActionType.IGNORE, categoryUuid: null } },
    });
  });

  it("reports the recipient conflict for an IGNORE rule too", async () => {
    prisma.recipient.findFirst.mockResolvedValue({ id: 2 });
    prisma.rule.findFirst.mockResolvedValue({ uuid: "existing", name: "Existing" });

    await expect(createRule({ ...input, action: { type: "IGNORE" } })).resolves.toEqual({
      ok: false,
      error: "RULE_RECIPIENT_CONFLICT",
      details: { existingRule: { uuid: "existing", name: "Existing" } },
    });
    expect(prisma.rule.create).not.toHaveBeenCalled();
  });

  it("enables an IGNORE rule even though it carries no category", async () => {
    prisma.rule.findFirst
      .mockResolvedValueOnce({
        id: 9,
        uuid: "rule-9",
        name: "Me",
        isEnabled: false,
        actionStatus: RuleActionStatus.VALID,
        actionType: RuleActionType.CATEGORIZE,
        recipientId: 2,
        categoryId: 3,
        subcategoryId: null,
      })
      .mockResolvedValueOnce(null);
    prisma.rule.update.mockResolvedValue({
      uuid: "rule-9",
      name: "Me",
      isEnabled: true,
      actionStatus: RuleActionStatus.VALID,
      actionType: RuleActionType.IGNORE,
      recipient: { uuid: "r", displayName: "Me" },
      category: null,
      subcategory: null,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    });

    await expect(
      updateRule({
        userUuid: "user-1",
        ruleUuid: "rule-9",
        isEnabled: true,
        action: { type: "IGNORE" },
      })
    ).resolves.toMatchObject({ ok: true, data: { isEnabled: true } });
    expect(prisma.rule.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actionType: RuleActionType.IGNORE,
          categoryId: null,
          subcategoryId: null,
        }),
      })
    );
  });

  it("loads IGNORE rules alongside categorizing ones for evaluation", async () => {
    prisma.rule.findMany.mockResolvedValue([
      {
        id: 8,
        uuid: "rule-8",
        actionType: RuleActionType.IGNORE,
        categoryId: null,
        subcategoryId: null,
        recipient: { uuid: "rcp-8" },
      },
    ]);

    await expect(loadEvaluatableRules("user-1")).resolves.toEqual([
      {
        id: 8,
        uuid: "rule-8",
        recipientUuid: "rcp-8",
        actionType: RuleActionType.IGNORE,
        categoryId: null,
        subcategoryId: null,
      },
    ]);
    expect(prisma.rule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            {
              actionType: RuleActionType.CATEGORIZE,
              categoryId: { not: null },
              category: { is: { userUuid: "user-1" } },
            },
            { actionType: RuleActionType.IGNORE },
          ],
        }),
      })
    );
  });

  it("soft deletes and disables a rule atomically", async () => {
    prisma.rule.findFirst.mockResolvedValue({ id: 9 });
    prisma.rule.update.mockResolvedValue({ uuid: "rule-9" });
    await expect(deleteRule({ userUuid: "user-1", ruleUuid: "rule-9" })).resolves.toEqual({
      ok: true,
      data: { uuid: "rule-9" },
    });
    expect(prisma.rule.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: { isEnabled: false, deletedAt: expect.any(Date) },
      select: { uuid: true },
    });
  });
});
