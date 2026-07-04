import { formatDate, formatDateTime, numberToINR } from "@/common/utils";
import type {
  RecipientDetailCategoryRow,
  RecipientDetailPageData,
  RecipientDetailSubcategoryPattern,
} from "@/features/recipients/types";
import type { RecipientDetailDto } from "@/server/modules/recipients/types";

function formatAliasType(aliasType: string) {
  switch (aliasType) {
    case "UPI_ID":
      return "UPI";
    case "CARD_MERCHANT":
      return "Card merchant";
    case "TEXT":
      return "Text alias";
    default:
      return aliasType.replace(/_/g, " ").toUpperCase();
  }
}

function formatAliasSource(aliasType: string) {
  switch (aliasType) {
    case "UPI_ID":
      return "UPI - from SMS";
    case "CARD_MERCHANT":
      return "Card merchant - from statement";
    case "TEXT":
      return "Text alias - from narration";
    default:
      return "Alias - from import";
  }
}

function normalizeAliasValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function detectAliasType(value: string) {
  const trimmed = value.trim();
  if (trimmed.includes("@")) {
    return "UPI_ID";
  }

  if (trimmed === trimmed.toUpperCase() && trimmed.length > 4) {
    return "CARD_MERCHANT";
  }

  return "TEXT";
}

function transactionMatchesAlias(input: {
  aliasType: string;
  normalizedAliasValue: string;
  recipientRaw: string;
}) {
  return (
    detectAliasType(input.recipientRaw) === input.aliasType &&
    normalizeAliasValue(input.recipientRaw) === input.normalizedAliasValue
  );
}

function formatSourceMixValue(sourceCounts: Map<string, number>) {
  if (sourceCounts.size === 0) {
    return "No transactions yet";
  }

  return [...sourceCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([source, count]) => `${source} ${count}`)
    .join(" / ");
}

export function buildRecipientDetailPageData(
  recipient: RecipientDetailDto
): RecipientDetailPageData {
  let totalSpent = 0;
  const categoryMap = new Map<
    string,
    { categoryUuid: string | null; transactionCount: number; totalAmount: number }
  >();
  const subcategoryMap = new Map<
    string,
    { category: string; subcategory: string; subcategoryUuid: string; transactionCount: number }
  >();
  const sourceCounts = new Map<string, number>();
  const uncategorizedTransactionUuids: string[] = [];
  const amounts = recipient.linkedTransactions.map((transaction) => transaction.amount);
  const averageAmount =
    amounts.length > 0 ? amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length : 0;
  const largeThreshold = averageAmount * 1.5;
  const newestTimestamp = recipient.linkedTransactions[0]?.timestamp
    ? new Date(recipient.linkedTransactions[0].timestamp).getTime()
    : null;

  for (const transaction of recipient.linkedTransactions) {
    totalSpent += transaction.amount;

    const category = transaction.category ?? "Uncategorized";
    const currentCategory = categoryMap.get(category) ?? {
      categoryUuid: transaction.categoryUuid,
      transactionCount: 0,
      totalAmount: 0,
    };
    currentCategory.categoryUuid = currentCategory.categoryUuid ?? transaction.categoryUuid;
    currentCategory.transactionCount += 1;
    currentCategory.totalAmount += transaction.amount;
    categoryMap.set(category, currentCategory);

    if (!transaction.categoryUuid) {
      uncategorizedTransactionUuids.push(transaction.uuid);
    }

    if (transaction.subcategory && transaction.subcategoryUuid) {
      const subcategoryKey = `${category}|||${transaction.subcategory}`;
      const currentSubcategory = subcategoryMap.get(subcategoryKey) ?? {
        category,
        subcategory: transaction.subcategory,
        subcategoryUuid: transaction.subcategoryUuid,
        transactionCount: 0,
      };
      currentSubcategory.transactionCount += 1;
      subcategoryMap.set(subcategoryKey, currentSubcategory);
    }

    sourceCounts.set(transaction.source, (sourceCounts.get(transaction.source) ?? 0) + 1);
  }

  const categoryRows: RecipientDetailCategoryRow[] = [...categoryMap.entries()]
    .map(([category, value]) => ({
      id: category,
      category,
      categoryUuid: value.categoryUuid,
      transactionCount: value.transactionCount,
      totalAmount: value.totalAmount,
      consistencyPercent:
        recipient.transactionCount > 0
          ? Math.round((value.transactionCount / recipient.transactionCount) * 100)
          : 0,
    }))
    .sort(
      (left, right) =>
        right.transactionCount - left.transactionCount || right.totalAmount - left.totalAmount
    );
  const dominantCategory =
    categoryRows.find((row) => row.category !== "Uncategorized" && row.categoryUuid != null) ?? null;
  const dominantSubcategory: RecipientDetailSubcategoryPattern | null = dominantCategory
    ? [...subcategoryMap.values()]
        .filter((value) => value.category === dominantCategory.category)
        .map((value) => ({
          id: value.subcategory,
          subcategory: value.subcategory,
          subcategoryUuid: value.subcategoryUuid,
          transactionCount: value.transactionCount,
        }))
        .sort((left, right) => right.transactionCount - left.transactionCount)[0] ?? null
    : null;

  const uncategorizedCount = categoryRows.find(
    (categoryRow) => categoryRow.category === "Uncategorized"
  )?.transactionCount ?? 0;
  const lastPaidAt = recipient.linkedTransactions[0]?.timestamp ?? null;
  const averagePayment =
    recipient.transactionCount > 0 ? totalSpent / recipient.transactionCount : 0;
  const topCategory = dominantCategory?.category ?? categoryRows[0]?.category ?? "No category data";
  const suggestionLabel = dominantCategory
    ? [dominantCategory.category, dominantSubcategory?.subcategory].filter(Boolean).join(" · ")
    : null;

  return {
    recipientUuid: recipient.uuid,
    displayName: recipient.displayName,
    normalizedName: recipient.normalizedName,
    transactionCount: recipient.transactionCount,
    aliasCount: recipient.aliases.length,
    totalSpent,
    averagePayment,
    lastPaidAt,
    createdAt: recipient.createdAt,
    updatedAt: recipient.updatedAt,
    aliases: recipient.aliases
      .map((alias) => ({
        id: alias.uuid,
        typeLabel: formatAliasType(alias.aliasType),
        value: alias.value,
        transactionCount: recipient.linkedTransactions.filter((transaction) => {
          return transactionMatchesAlias({
            aliasType: alias.aliasType,
            normalizedAliasValue: alias.normalizedValue,
            recipientRaw: transaction.recipientRaw,
          });
        }).length,
        sourceLabel: formatAliasSource(alias.aliasType),
      }))
      .sort(
        (left, right) =>
          right.transactionCount - left.transactionCount ||
          left.value.localeCompare(right.value) ||
          left.id.localeCompare(right.id)
      ),
    categoryRows,
    dominantCategory,
    dominantSubcategory,
    cleanupSuggestion: {
      category: dominantCategory?.category ?? null,
      categoryUuid: dominantCategory?.categoryUuid ?? null,
      subcategory: dominantSubcategory?.subcategory ?? null,
      subcategoryUuid: dominantSubcategory?.subcategoryUuid ?? null,
      consistencyPercent: dominantCategory?.consistencyPercent ?? 0,
      categorizedTransactionCount: dominantCategory?.transactionCount ?? 0,
      totalTransactionCount: recipient.transactionCount,
      totalAmount: dominantCategory?.totalAmount ?? 0,
      uncategorizedCount,
      uncategorizedTransactionUuids,
      reviewTransactionUuid: uncategorizedTransactionUuids[0] ?? null,
      applyLabel: suggestionLabel ? `Apply ${suggestionLabel}` : null,
    },
    recentTransactions: recipient.linkedTransactions.map((transaction) => ({
      uuid: transaction.uuid,
      amount: transaction.amount,
      category: transaction.category,
      categoryUuid: transaction.categoryUuid,
      subcategory: transaction.subcategory,
      subcategoryUuid: transaction.subcategoryUuid,
      source: transaction.source,
      timestamp: transaction.timestamp,
      status: transaction.categoryUuid ? "categorized" : "uncategorized",
      isLarge: transaction.amount >= largeThreshold && transaction.amount > averageAmount,
      isRecent:
        newestTimestamp == null
          ? false
          : newestTimestamp - new Date(transaction.timestamp).getTime() <= 30 * 24 * 60 * 60 * 1000,
    })),
    metadata: [
      {
        label: "Recipient UUID",
        value: recipient.uuid,
        copyValue: recipient.uuid,
      },
      {
        label: "Transaction count",
        value: String(recipient.transactionCount),
      },
      {
        label: "Alias count",
        value: String(recipient.aliases.length),
      },
    ],
    quickChecks: [
      {
        id: "linked",
        label: "Recipient linked",
        status: recipient.transactionCount > 0 ? "passed" : "attention",
        badgeLabel: recipient.transactionCount > 0 ? "Passed" : "Action needed",
      },
      {
        id: "aliases",
        label: "Has aliases",
        status: recipient.aliases.length > 0 ? "passed" : "attention",
        badgeLabel: recipient.aliases.length > 0 ? "Passed" : "Missing",
      },
      {
        id: "categorization",
        label: "Needs cleanup",
        status: uncategorizedCount > 0 ? "attention" : "passed",
        badgeLabel: uncategorizedCount > 0 ? `${uncategorizedCount} uncategorized` : "No issues",
      },
    ],
    insights: [
      {
        id: "top-category",
        label: "Most common category",
        value: topCategory,
        tone: topCategory === "Uncategorized" ? "accent" : "default",
      },
      {
        id: "average-payment",
        label: "Average payment",
        value: numberToINR(averagePayment),
      },
      {
        id: "source-mix",
        label: "Source mix",
        value: formatSourceMixValue(sourceCounts),
      },
      {
        id: "last-paid",
        label: "Last paid",
        value: lastPaidAt ? formatDate(lastPaidAt) : "No transactions yet",
      },
    ],
  };
}

export function formatRecipientTotal(amount: number) {
  return numberToINR(amount);
}

export function formatRecipientDate(value: string) {
  return formatDate(value);
}

export function formatRecipientDateTime(value: string) {
  return formatDateTime(value);
}

