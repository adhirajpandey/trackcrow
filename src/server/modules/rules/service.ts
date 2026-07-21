import { Prisma, RuleActionStatus } from "@/generated/prisma-rewrite";
import prisma from "@/lib/prisma-rewrite";
import { logger } from "@/lib/logger";
import { fail, ok } from "@/server/shared/result";

import type { EvaluatableRule } from "./evaluator";
import type {
  CreateRuleInput,
  ListRulesInput,
  RuleDto,
  RuleLookupInput,
  RuleMutationResult,
  UpdateRuleInput,
} from "./types";

const ruleInclude = {
  recipient: { select: { uuid: true, displayName: true } },
  category: { select: { uuid: true, name: true } },
  subcategory: { select: { uuid: true, name: true } },
} as const;

function toRuleDto(rule: {
  uuid: string;
  name: string;
  isEnabled: boolean;
  actionStatus: RuleActionStatus;
  recipient: { uuid: string; displayName: string };
  category: { uuid: string; name: string } | null;
  subcategory: { uuid: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}): RuleDto {
  return {
    uuid: rule.uuid,
    name: rule.name,
    isEnabled: rule.isEnabled,
    actionStatus: rule.actionStatus,
    conditions: { recipient: { equals: rule.recipient.uuid } },
    recipient: rule.recipient,
    action: {
      categoryUuid: rule.category?.uuid ?? null,
      categoryName: rule.category?.name ?? null,
      subcategoryUuid: rule.subcategory?.uuid ?? null,
      subcategoryName: rule.subcategory?.name ?? null,
    },
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  };
}

async function resolveRecipient(userUuid: string, recipientUuid: string) {
  return prisma.recipient.findFirst({
    where: { userUuid, uuid: recipientUuid },
    select: { id: true },
  });
}

async function resolveAction(
  userUuid: string,
  action: { categoryUuid: string; subcategoryUuid: string | null }
) {
  const category = await prisma.category.findFirst({
    where: { userUuid, uuid: action.categoryUuid },
    select: { id: true },
  });
  if (!category) {
    return fail("VALIDATION_ERROR" as const, [
      { path: ["action", "categoryUuid"], message: "Unknown category" },
    ]);
  }

  if (!action.subcategoryUuid) {
    return ok({ categoryId: category.id, subcategoryId: null });
  }
  const subcategory = await prisma.subcategory.findFirst({
    where: { userUuid, uuid: action.subcategoryUuid },
    select: { id: true, categoryId: true },
  });
  if (!subcategory || subcategory.categoryId !== category.id) {
    return fail("VALIDATION_ERROR" as const, [
      {
        path: ["action", "subcategoryUuid"],
        message: subcategory ? "Subcategory does not belong to category" : "Unknown subcategory",
      },
    ]);
  }
  return ok({ categoryId: category.id, subcategoryId: subcategory.id });
}

async function findEnabledConflict(
  userUuid: string,
  recipientId: number,
  excludeId?: number
) {
  return prisma.rule.findFirst({
    where: {
      userUuid,
      recipientId,
      isEnabled: true,
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { uuid: true, name: true },
  });
}

function conflict(existingRule: { uuid: string; name: string }) {
  return fail("RULE_RECIPIENT_CONFLICT" as const, { existingRule });
}

export async function listRules(input: ListRulesInput) {
  const page = input.page ?? 1;
  const pageSize = Math.min(input.size ?? 20, 100);
  const where: Prisma.RuleWhereInput = {
    userUuid: input.userUuid,
    deletedAt: null,
    ...(input.q
      ? {
          OR: [
            { name: { contains: input.q.trim(), mode: "insensitive" } },
            { recipient: { displayName: { contains: input.q.trim(), mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(input.status === "enabled" ? { isEnabled: true } : {}),
    ...(input.status === "disabled"
      ? { isEnabled: false, actionStatus: RuleActionStatus.VALID }
      : {}),
    ...(input.status === "needsRepair"
      ? { actionStatus: RuleActionStatus.NEEDS_REPAIR }
      : {}),
  };

  try {
    const [total, rules] = await Promise.all([
      prisma.rule.count({ where }),
      prisma.rule.findMany({
        where,
        include: ruleInclude,
        orderBy: [{ isEnabled: "desc" }, { updatedAt: "desc" }, { uuid: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    return ok({
      rules: rules.map(toRuleDto),
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    });
  } catch (error) {
    logger.error({ event: "rule.list.db_failed", userId: input.userUuid }, error);
    return fail("INTERNAL_ERROR" as const);
  }
}

export async function getRule(input: RuleLookupInput) {
  try {
    const rule = await prisma.rule.findFirst({
      where: { userUuid: input.userUuid, uuid: input.ruleUuid, deletedAt: null },
      include: ruleInclude,
    });
    return rule ? ok(toRuleDto(rule)) : fail("NOT_FOUND" as const);
  } catch (error) {
    logger.error({ event: "rule.read.db_failed", userId: input.userUuid, ruleUuid: input.ruleUuid }, error);
    return fail("INTERNAL_ERROR" as const);
  }
}

export async function createRule(input: CreateRuleInput): Promise<RuleMutationResult> {
  try {
    const recipient = await resolveRecipient(
      input.userUuid,
      input.conditions.recipient.equals
    );
    if (!recipient) {
      return fail("VALIDATION_ERROR", [
        { path: ["conditions", "recipient", "equals"], message: "Unknown recipient" },
      ]);
    }
    const action = await resolveAction(input.userUuid, input.action);
    if (!action.ok) return action;

    if (input.isEnabled) {
      const existing = await findEnabledConflict(input.userUuid, recipient.id);
      if (existing) return conflict(existing);
    }

    const rule = await prisma.rule.create({
      data: {
        userUuid: input.userUuid,
        recipientId: recipient.id,
        categoryId: action.data.categoryId,
        subcategoryId: action.data.subcategoryId,
        name: input.name.trim(),
        isEnabled: input.isEnabled,
        actionStatus: RuleActionStatus.VALID,
      },
      include: ruleInclude,
    });
    return ok(toRuleDto(rule));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const recipient = await resolveRecipient(input.userUuid, input.conditions.recipient.equals);
      const existing = recipient
        ? await findEnabledConflict(input.userUuid, recipient.id)
        : null;
      if (existing) return conflict(existing);
    }
    logger.error({ event: "rule.create.db_failed", userId: input.userUuid }, error);
    return fail("INTERNAL_ERROR");
  }
}

export async function updateRule(input: UpdateRuleInput): Promise<RuleMutationResult> {
  try {
    const current = await prisma.rule.findFirst({
      where: { userUuid: input.userUuid, uuid: input.ruleUuid, deletedAt: null },
      select: {
        id: true,
        uuid: true,
        name: true,
        isEnabled: true,
        actionStatus: true,
        recipientId: true,
        categoryId: true,
        subcategoryId: true,
      },
    });
    if (!current) return fail("NOT_FOUND");

    let recipientId = current.recipientId;
    if (input.conditions) {
      const recipient = await resolveRecipient(input.userUuid, input.conditions.recipient.equals);
      if (!recipient) {
        return fail("VALIDATION_ERROR", [
          { path: ["conditions", "recipient", "equals"], message: "Unknown recipient" },
        ]);
      }
      recipientId = recipient.id;
    }

    let categoryId = current.categoryId;
    let subcategoryId = current.subcategoryId;
    let actionStatus = current.actionStatus;
    if (input.action) {
      const action = await resolveAction(input.userUuid, input.action);
      if (!action.ok) return action;
      categoryId = action.data.categoryId;
      subcategoryId = action.data.subcategoryId;
      actionStatus = RuleActionStatus.VALID;
    }

    const isEnabled = input.isEnabled ?? current.isEnabled;
    if (isEnabled && (actionStatus !== RuleActionStatus.VALID || categoryId == null)) {
      return fail("VALIDATION_ERROR", [
        { path: ["isEnabled"], message: "Repair the rule action before enabling it" },
      ]);
    }
    if (isEnabled) {
      const existing = await findEnabledConflict(input.userUuid, recipientId, current.id);
      if (existing) return conflict(existing);
    }

    const rule = await prisma.rule.update({
      where: { id: current.id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.conditions ? { recipientId } : {}),
        ...(input.action ? { categoryId, subcategoryId, actionStatus } : {}),
        ...(input.isEnabled !== undefined ? { isEnabled } : {}),
      },
      include: ruleInclude,
    });
    return ok(toRuleDto(rule));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const current = await prisma.rule.findFirst({
        where: { userUuid: input.userUuid, uuid: input.ruleUuid, deletedAt: null },
        select: { id: true, recipientId: true },
      });
      const existing = current
        ? await findEnabledConflict(input.userUuid, current.recipientId, current.id)
        : null;
      if (existing) return conflict(existing);
    }
    logger.error({ event: "rule.update.db_failed", userId: input.userUuid, ruleUuid: input.ruleUuid }, error);
    return fail("INTERNAL_ERROR");
  }
}

export async function deleteRule(input: RuleLookupInput) {
  try {
    const current = await prisma.rule.findFirst({
      where: { userUuid: input.userUuid, uuid: input.ruleUuid, deletedAt: null },
      select: { id: true },
    });
    if (!current) return fail("NOT_FOUND" as const);
    const rule = await prisma.rule.update({
      where: { id: current.id },
      data: { isEnabled: false, deletedAt: new Date() },
      select: { uuid: true },
    });
    return ok(rule);
  } catch (error) {
    logger.error({ event: "rule.delete.db_failed", userId: input.userUuid, ruleUuid: input.ruleUuid }, error);
    return fail("INTERNAL_ERROR" as const);
  }
}

export async function loadEvaluatableRules(userUuid: string): Promise<EvaluatableRule[]> {
  const rules = await prisma.rule.findMany({
    where: {
      userUuid,
      isEnabled: true,
      deletedAt: null,
      actionStatus: RuleActionStatus.VALID,
      categoryId: { not: null },
      category: { is: { userUuid } },
    },
    select: {
      id: true,
      uuid: true,
      categoryId: true,
      subcategoryId: true,
      recipient: { select: { uuid: true } },
    },
  });
  return rules.map((rule) => ({
    id: rule.id,
    uuid: rule.uuid,
    recipientUuid: rule.recipient.uuid,
    categoryId: rule.categoryId as number,
    subcategoryId: rule.subcategoryId,
  }));
}
