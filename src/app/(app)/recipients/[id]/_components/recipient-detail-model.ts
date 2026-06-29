import { formatDate, formatDateTime, numberToINR } from "@/common/utils";
import type { RecipientDetailPageData } from "@/features/recipients/types";
import type { RecipientDetailDto } from "@/server/modules/recipients/types";

const recentTransactionsLimit = 6;

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
  const categoryMap = new Map<string, { transactionCount: number; totalAmount: number }>();
  const sourceCounts = new Map<string, number>();

  for (const transaction of recipient.linkedTransactions) {
    totalSpent += transaction.amount;

    const category = transaction.category ?? "Uncategorized";
    const currentCategory = categoryMap.get(category) ?? {
      transactionCount: 0,
      totalAmount: 0,
    };
    currentCategory.transactionCount += 1;
    currentCategory.totalAmount += transaction.amount;
    categoryMap.set(category, currentCategory);

    sourceCounts.set(transaction.source, (sourceCounts.get(transaction.source) ?? 0) + 1);
  }

  const categoryRows = [...categoryMap.entries()]
    .map(([category, value]) => ({
      id: category,
      category,
      transactionCount: value.transactionCount,
      totalAmount: value.totalAmount,
    }))
    .sort(
      (left, right) =>
        right.totalAmount - left.totalAmount || right.transactionCount - left.transactionCount
    );

  const uncategorizedCount = categoryRows.find(
    (categoryRow) => categoryRow.category === "Uncategorized"
  )?.transactionCount ?? 0;
  const lastPaidAt = recipient.linkedTransactions[0]?.timestamp ?? null;
  const averagePayment =
    recipient.transactionCount > 0 ? totalSpent / recipient.transactionCount : 0;
  const topCategory = categoryRows[0]?.category ?? "No category data";

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
      normalizedValue: identifier.normalizedValue,
    })),
    categoryRows,
    recentTransactions: recipient.linkedTransactions
      .slice(0, recentTransactionsLimit)
      .map((transaction) => ({
        id: transaction.id,
        uuid: transaction.uuid,
        amount: transaction.amount,
        category: transaction.category,
        source: transaction.source,
        timestamp: transaction.timestamp,
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
