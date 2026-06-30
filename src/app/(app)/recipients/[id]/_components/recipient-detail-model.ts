import { formatDate, formatDateTime, numberToINR } from "@/common/utils";
import type {
  RecipientDetailCategoryRow,
  RecipientDetailPageData,
  RecipientDetailSubcategoryPattern,
} from "@/features/recipients/types";
import type { RecipientDetailDto } from "@/server/modules/recipients/types";

const recentTransactionsLimit = 12;

function formatIdentifierKind(kind: string) {
  switch (kind) {
    case "UPI_ID":
      return "UPI";
    case "CARD_MERCHANT":
      return "CARD";
    case "BANK_ACCOUNT":
      return "BANK";
    case "PHONE":
      return "PHONE";
    default:
      return kind.replace(/_/g, " ").toUpperCase();
  }
}

function formatIdentifierSource(kind: string) {
  switch (kind) {
    case "UPI_ID":
      return "UPI · from SMS";
    case "CARD_MERCHANT":
      return "Card merchant · from statement";
    case "BANK_ACCOUNT":
      return "Bank account · from transfer";
    case "PHONE":
      return "Phone · from SMS";
    case "TEXT":
      return "Text match · from narration";
    default:
      return "Identifier · from import";
  }
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
    { categoryId: number | null; transactionCount: number; totalAmount: number }
  >();
  const subcategoryMap = new Map<
    string,
    { category: string; subcategory: string; subcategoryId: number; transactionCount: number }
  >();
  const sourceCounts = new Map<string, number>();
  const uncategorizedTransactionIds: number[] = [];
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
      categoryId: transaction.categoryId,
      transactionCount: 0,
      totalAmount: 0,
    };
    currentCategory.categoryId = currentCategory.categoryId ?? transaction.categoryId;
    currentCategory.transactionCount += 1;
    currentCategory.totalAmount += transaction.amount;
    categoryMap.set(category, currentCategory);

    if (!transaction.categoryId) {
      uncategorizedTransactionIds.push(transaction.id);
    }

    if (transaction.subcategory && transaction.subcategoryId) {
      const subcategoryKey = `${category}|||${transaction.subcategory}`;
      const currentSubcategory = subcategoryMap.get(subcategoryKey) ?? {
        category,
        subcategory: transaction.subcategory,
        subcategoryId: transaction.subcategoryId,
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
      categoryId: value.categoryId,
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
    categoryRows.find((row) => row.category !== "Uncategorized" && row.categoryId != null) ?? null;
  const dominantSubcategory: RecipientDetailSubcategoryPattern | null = dominantCategory
    ? [...subcategoryMap.values()]
        .filter((value) => value.category === dominantCategory.category)
        .map((value) => ({
          id: value.subcategory,
          subcategory: value.subcategory,
          subcategoryId: value.subcategoryId,
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
    recipientId: recipient.id,
    displayName: recipient.displayName,
    normalizedName: recipient.normalizedName,
    transactionCount: recipient.transactionCount,
    identifierCount: recipient.identifiers.length,
    totalSpent,
    averagePayment,
    lastPaidAt,
    createdAt: recipient.createdAt,
    updatedAt: recipient.updatedAt,
    identifiers: recipient.identifiers.map((identifier) => ({
      id: identifier.uuid,
      kindLabel: formatIdentifierKind(identifier.kind),
      value: identifier.value,
      transactionCount: recipient.linkedTransactions.filter((transaction) => {
        const normalizedRecipientRaw = transaction.recipientRaw.trim().toLowerCase().replace(/\s+/g, " ");
        const normalizedRecipientName = transaction.recipientName
          ? transaction.recipientName.trim().toLowerCase().replace(/\s+/g, " ")
          : null;

        return (
          normalizedRecipientRaw === identifier.normalizedValue ||
          normalizedRecipientName === identifier.normalizedValue
        );
      }).length,
      sourceLabel: formatIdentifierSource(identifier.kind),
    })),
    categoryRows,
    dominantCategory,
    dominantSubcategory,
    cleanupSuggestion: {
      category: dominantCategory?.category ?? null,
      categoryId: dominantCategory?.categoryId ?? null,
      subcategory: dominantSubcategory?.subcategory ?? null,
      subcategoryId: dominantSubcategory?.subcategoryId ?? null,
      consistencyPercent: dominantCategory?.consistencyPercent ?? 0,
      categorizedTransactionCount: dominantCategory?.transactionCount ?? 0,
      totalTransactionCount: recipient.transactionCount,
      totalAmount: dominantCategory?.totalAmount ?? 0,
      uncategorizedCount,
      uncategorizedTransactionIds,
      reviewTransactionId: uncategorizedTransactionIds[0] ?? null,
      applyLabel: suggestionLabel ? `Apply ${suggestionLabel}` : null,
    },
    recentTransactions: recipient.linkedTransactions.slice(0, recentTransactionsLimit).map((transaction) => ({
      id: transaction.id,
      uuid: transaction.uuid,
      amount: transaction.amount,
      category: transaction.category,
      categoryId: transaction.categoryId,
      subcategory: transaction.subcategory,
      subcategoryId: transaction.subcategoryId,
      source: transaction.source,
      timestamp: transaction.timestamp,
      status: transaction.categoryId ? "categorized" : "uncategorized",
      isLarge: transaction.amount >= largeThreshold && transaction.amount > averageAmount,
      isRecent:
        newestTimestamp == null
          ? false
          : newestTimestamp - new Date(transaction.timestamp).getTime() <= 30 * 24 * 60 * 60 * 1000,
    })),
    metadata: [
      {
        label: "Recipient ID",
        value: `rcp_${recipient.id}`,
        copyValue: `rcp_${recipient.id}`,
      },
      {
        label: "Recipient UUID",
        value: recipient.uuid,
        copyValue: recipient.uuid,
      },
      {
        label: "Normalized name",
        value: recipient.normalizedName,
      },
      {
        label: "Transaction count",
        value: String(recipient.transactionCount),
      },
      {
        label: "Identifier count",
        value: String(recipient.identifiers.length),
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
        id: "identifiers",
        label: "Has identifiers",
        status: recipient.identifiers.length > 0 ? "passed" : "attention",
        badgeLabel: recipient.identifiers.length > 0 ? "Passed" : "Missing",
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
