import "server-only";

import prisma from "@/lib/prisma-rewrite";
import type { RulesPageInitialData } from "@/features/rules/types";
import { getRulesQuery } from "@/features/rules/query-state";
import { requirePageSessionUser } from "@/server/auth/session";
import { listCategoriesForUser } from "@/server/modules/categories/service";
import { listRecipients } from "@/server/modules/recipients/service";
import { getRule, listRules } from "@/server/modules/rules/service";

export async function getRulesPageData(
  params: Record<string, string | string[] | undefined>
): Promise<RulesPageInitialData> {
  const { userUuid } = await requirePageSessionUser();
  const query = getRulesQuery(params);
  const edit = Array.isArray(params.edit) ? params.edit[0] : params.edit;
  const [rules, categories, recipients, editedRule] = await Promise.all([
    listRules({ userUuid, page: query.page, size: query.pageSize, q: query.q, status: query.status }),
    listCategoriesForUser({ userUuid }),
    listRecipients({ userUuid, page: 1, size: 100, sortBy: "transactionCount", sortOrder: "desc" }),
    edit ? getRule({ userUuid, ruleUuid: edit }) : Promise.resolve(null),
  ]);

  const recipientUuid = Array.isArray(params.recipient) ? params.recipient[0] : params.recipient;
  const categoryUuid = Array.isArray(params.category) ? params.category[0] : params.category;
  const subcategoryUuid = Array.isArray(params.subcategory) ? params.subcategory[0] : params.subcategory;
  let initialPrefill: RulesPageInitialData["initialPrefill"] = null;
  if (recipientUuid && categoryUuid) {
    const [recipient, category, subcategory] = await Promise.all([
      prisma.recipient.findFirst({ where: { userUuid, uuid: recipientUuid }, select: { uuid: true } }),
      prisma.category.findFirst({ where: { userUuid, uuid: categoryUuid }, select: { id: true, uuid: true } }),
      subcategoryUuid
        ? prisma.subcategory.findFirst({ where: { userUuid, uuid: subcategoryUuid }, select: { uuid: true, categoryId: true } })
        : null,
    ]);
    if (recipient && category && (!subcategoryUuid || subcategory?.categoryId === category.id)) {
      initialPrefill = { recipientUuid, categoryUuid, subcategoryUuid: subcategory?.uuid ?? null };
    }
  }

  return {
    initialRules: rules.ok ? rules.data : { rules: [], page: query.page, pageSize: query.pageSize, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
    initialQuery: query,
    categories: categories.ok ? categories.data.map((category) => ({
      ...category,
      subcategories: category.subcategories.map((subcategory) => ({ ...subcategory, categoryUuid: category.uuid })),
    })) : [],
    recipients: recipients.ok ? recipients.data.recipients : [],
    initialForm: editedRule && editedRule.ok ? editedRule.data : null,
    initialPrefill,
  };
}
