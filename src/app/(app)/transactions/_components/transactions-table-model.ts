import type {
  TransactionSortBy,
  TransactionSortOrder,
  TransactionsPagination,
} from "@/features/transactions/types";

export const transactionTablePageSize = 10;

export type TransactionTableColumn =
  | "timestamp"
  | "recipient"
  | "amount"
  | "category"
  | "subcategory"
  | "source"
  | "status";

export type TransactionTableRow = {
  id: number;
  uuid: string;
  recipient?: string;
  amount: number;
  category: string | null;
  subcategory?: string | null;
  source?: string | null;
  timestamp: string;
  status?: "categorized" | "uncategorized" | string;
};

export function getTransactionTableColumnLabels(columns: TransactionTableColumn[]) {
  const labels: Record<TransactionTableColumn, string> = {
    timestamp: "Date & time",
    recipient: "Recipient",
    amount: "Amount",
    category: "Category",
    subcategory: "Subcategory",
    source: "Source",
    status: "Status",
  };

  return columns.map((column) => labels[column]);
}

export function toggleTransactionTableSort(
  current: {
    sortBy: TransactionSortBy;
    sortOrder: TransactionSortOrder;
  },
  sortBy: TransactionSortBy
) {
  if (current.sortBy === sortBy) {
    return {
      sortBy,
      sortOrder: current.sortOrder === "asc" ? "desc" : "asc",
    } satisfies { sortBy: TransactionSortBy; sortOrder: TransactionSortOrder };
  }

  return {
    sortBy,
    sortOrder: "desc",
  } satisfies { sortBy: TransactionSortBy; sortOrder: TransactionSortOrder };
}

export function sortTransactionTableRows<T extends TransactionTableRow>(
  rows: T[],
  sortBy: TransactionSortBy,
  sortOrder: TransactionSortOrder
) {
  const direction = sortOrder === "asc" ? 1 : -1;

  return [...rows].sort((left, right) => {
    const comparison =
      sortBy === "amount"
        ? left.amount - right.amount
        : new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime();

    if (comparison !== 0) {
      return comparison * direction;
    }

    return left.id - right.id;
  });
}

export function paginateTransactionTableRows<T>(
  rows: T[],
  page: number,
  pageSize = transactionTablePageSize
) {
  const total = rows.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const normalizedPage = totalPages === 0 ? 1 : Math.min(Math.max(1, page), totalPages);
  const start = (normalizedPage - 1) * pageSize;

  return {
    rows: rows.slice(start, start + pageSize),
    pagination: {
      page: normalizedPage,
      pageSize,
      total,
      totalPages,
      hasPrev: normalizedPage > 1,
      hasNext: normalizedPage < totalPages,
    } satisfies TransactionsPagination,
  };
}

export function buildTransactionTableFooterSummary(pagination: TransactionsPagination) {
  if (pagination.total === 0) {
    return "Showing 0 to 0 of 0 transactions";
  }

  const start = (pagination.page - 1) * pagination.pageSize + 1;
  const end = Math.min(pagination.page * pagination.pageSize, pagination.total);
  return `Showing ${start} to ${end} of ${pagination.total} transactions`;
}
