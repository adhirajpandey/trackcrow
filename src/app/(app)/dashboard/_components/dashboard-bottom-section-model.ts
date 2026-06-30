import type { CategoryOption, TransactionListResponse } from "@/common/types";
import { formatRecipientDisplayLabel } from "@/common/recipient-display";
import type { DashboardPageData } from "@/server/page-data/dashboard-page-data";

export type DashboardCategoryFilterValue = "all" | "uncategorized" | string;

export type DashboardRecentTransactionItem = DashboardPageData["recentTransactions"][number];
export type DashboardTableLayout = {
  columns: string[];
  template: string;
  columnWidths?: string[];
  rightAlignedColumns?: number[];
  centerAlignedColumns?: number[];
};

export const dashboardTableLayouts = {
  spendingByCategory: {
    columns: ["Category", "Amount", "% of spend"],
    template: "minmax(0,1.55fr) 96px 72px",
    columnWidths: ["58%", "25%", "17%"],
    rightAlignedColumns: [1, 2],
  },
  frequentRecipients: {
    columns: ["Recipient", "Payments", "Amount"],
    template: "minmax(0,1.45fr) 78px 104px",
    columnWidths: ["54%", "22%", "24%"],
    rightAlignedColumns: [1, 2],
  },
  largestTransactions: {
    columns: ["Recipient", "Date", "Amount"],
    template: "minmax(0,1.5fr) 108px 96px",
    columnWidths: ["50%", "26%", "24%"],
    rightAlignedColumns: [2],
  },
  recentTransactions: {
    columns: ["Date", "Recipient", "Amount", "Category"],
    template: "132px minmax(0,1.55fr) 96px minmax(180px,1fr)",
    rightAlignedColumns: [2],
  },
} satisfies Record<string, DashboardTableLayout>;

export function buildRecentTransactionsApiHref(input: {
  startDate: string | null;
  endDate: string | null;
  query: string;
  category: DashboardCategoryFilterValue;
  size?: number;
}) {
  const params = new URLSearchParams();

  if (input.startDate) {
    params.set("startDate", input.startDate);
  }
  if (input.endDate) {
    params.set("endDate", input.endDate);
  }
  if (input.query.trim()) {
    params.set("q", input.query.trim());
  }
  if (input.category !== "all") {
    params.append(
      "category",
      input.category === "uncategorized" ? "Uncategorized" : input.category
    );
  }

  params.set("size", String(input.size ?? 6));
  params.set("sortBy", "timestamp");
  params.set("sortOrder", "desc");

  return `/api/transactions?${params.toString()}`;
}

export function mapTransactionListToDashboardItems(
  response: TransactionListResponse
): DashboardRecentTransactionItem[] {
  return response.transactions.map((transaction) => ({
    id: transaction.id,
    uuid: transaction.uuid,
    recipient: formatRecipientDisplayLabel({
      recipientName: transaction.recipientName,
      recipientDisplayName: transaction.recipientDisplayName,
      recipientRaw: transaction.recipientRaw,
      fallbackLabel: "Unknown recipient",
    }),
    category: transaction.category,
    amount: transaction.amount,
    timestamp: transaction.timestamp,
    source: transaction.source,
  }));
}

export function buildCategoryQuickTagOptions(categories: CategoryOption[]) {
  return categories.map((category) => ({
    id: category.id,
    label: category.name,
  }));
}

export function buildLargestTransactionHref(transactionId: number) {
  return `/transactions/${transactionId}`;
}

export function getCategoryTriggerLabel(category: string | null) {
  return category ?? "Select category";
}
