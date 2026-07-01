"use client";

import Link from "next/link";
import { type ReactNode, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

import { DataTableEmpty } from "@/components/product/data-table-empty";
import { DataTablePagination } from "@/components/product/data-table-pagination";
import { DataTableShell } from "@/components/product/data-table-shell";
import { SortableTableHead } from "@/components/product/sortable-table-head";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  TransactionSortBy,
  TransactionSortOrder,
  TransactionsPagination,
} from "@/features/transactions/types";
import {
  handleLinkRowClick,
  handleLinkRowKeyDown,
} from "@/lib/row-link-navigation";
import { cn } from "@/lib/utils";

import {
  buildPaginationItems,
  formatTransactionAmount,
  formatTransactionDateLabel,
  formatTransactionTimeLabel,
} from "./transactions-view-model";
import {
  buildTransactionTableFooterSummary,
  getTransactionTableColumnLabels,
  type TransactionTableColumn,
  type TransactionTableRow,
} from "./transactions-table-model";

export type { TransactionTableColumn, TransactionTableRow };

type ColumnMeta = {
  align?: "left" | "right";
  sortable?: TransactionSortBy;
  widthClassName?: string;
};

type TransactionTableSort = {
  sortBy: TransactionSortBy;
  sortOrder: TransactionSortOrder;
  sortableColumns: TransactionSortBy[];
  onSort: (sortBy: TransactionSortBy) => void;
};

type TransactionTablePagination = TransactionsPagination & {
  buildPageHref?: (page: number) => string;
  onNavigate?: (href: string) => void;
  onPageChange?: (page: number) => void;
};

type TransactionTableVariant = "full" | "compact" | "embedded";

type RenderColumnCell<Row extends TransactionTableRow> = Partial<
  Record<TransactionTableColumn, (row: Row) => ReactNode>
>;

export function TransactionsTable<Row extends TransactionTableRow>({
  rows,
  columns,
  variant = "full",
  sort,
  pagination,
  rowHref,
  onNavigate,
  selectedRowUuid,
  emptyTitle,
  renderColumnCell,
  footerActions,
  className,
}: {
  rows: Row[];
  columns: TransactionTableColumn[];
  variant?: TransactionTableVariant;
  sort?: TransactionTableSort;
  pagination?: TransactionTablePagination;
  rowHref: (row: Row) => string;
  onNavigate: (href: string) => void;
  selectedRowUuid?: string | null;
  emptyTitle: string;
  renderColumnCell?: RenderColumnCell<Row>;
  footerActions?: ReactNode;
  className?: string;
}) {
  const tableColumns = useMemo(
    () => buildColumns(columns, variant, renderColumnCell),
    [columns, renderColumnCell, variant]
  );
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    state: sort
      ? {
          sorting: [
            {
              id: sort.sortBy,
              desc: sort.sortOrder === "desc",
            },
          ],
        }
      : undefined,
  });
  const content = (
    <>
      {rows.length > 0 ? (
        <div className={cn(variant === "full" ? "hidden md:block" : "block")}>
          <Table className={cn(getTableMinWidth(columns, variant), "table-fixed")}>
            <TableHeader className="border-b border-border/40 bg-background/16">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta as ColumnMeta | undefined;
                    const sortable = meta?.sortable;
                    const isSortable = sortable && sort?.sortableColumns.includes(sortable);

                    if (!isSortable || !sortable || !sort) {
                      return (
                        <TableHead
                          key={header.id}
                          className={cn(
                            meta?.align === "right" && "text-right",
                            meta?.widthClassName
                          )}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      );
                    }

                    return (
                      <SortableTableHead
                        key={header.id}
                        label={String(header.column.columnDef.header)}
                        direction={sort.sortBy === sortable ? sort.sortOrder : null}
                        align={meta?.align ?? "left"}
                        className={meta?.widthClassName}
                        onClick={() => sort.onSort(sortable)}
                      />
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => {
                const href = rowHref(row.original);

                return (
                  <TableRow
                    key={row.original.uuid}
                    tabIndex={0}
                    role="link"
                    className={cn(
                      "group cursor-pointer",
                      variant !== "full" && "hover:bg-secondary/18",
                      selectedRowUuid === row.original.uuid && "bg-primary/10"
                    )}
                    onClick={(event) => {
                      handleLinkRowClick(event, href, onNavigate);
                    }}
                    onKeyDown={(event) => {
                      handleLinkRowKeyDown(event, href, onNavigate);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta as ColumnMeta | undefined;
                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            variant === "compact" ? "py-4" : "py-4",
                            meta?.align === "right" && "text-right",
                            meta?.widthClassName
                          )}
                        >
                          {cell.column.id === "recipient" ? (
                            <Link
                              href={href}
                              className="block rounded-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </Link>
                          ) : (
                            flexRender(cell.column.columnDef.cell, cell.getContext())
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <DataTableEmpty title={emptyTitle} />
      )}

      {pagination || footerActions ? (
        <div
          className={cn(
            "flex flex-col gap-4 border-t border-border/45 px-4 py-4 sm:px-5",
            pagination
              ? "lg:flex-row lg:items-center lg:justify-between"
              : "lg:items-center lg:justify-end",
            pagination && !footerActions && "lg:flex-row"
          )}
        >
          {pagination ? (
            <p className="text-sm text-secondary-foreground">
              {buildTransactionTableFooterSummary(pagination)}
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            {pagination && pagination.totalPages > 1 ? (
              <DataTablePagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                hasPrev={pagination.hasPrev}
                hasNext={pagination.hasNext}
                items={buildPaginationItems(pagination.page, pagination.totalPages)}
                buildPageHref={(page) => pagination.buildPageHref?.(page) ?? String(page)}
                onNavigate={(href) => {
                  if (pagination.onPageChange) {
                    pagination.onPageChange(Number(href));
                    return;
                  }

                  pagination.onNavigate?.(href);
                }}
              />
            ) : null}
            {footerActions}
          </div>
        </div>
      ) : null}
    </>
  );

  if (variant === "full") {
    return <DataTableShell className={className}>{content}</DataTableShell>;
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[8px] border border-border/45 bg-background/10",
        variant === "embedded" && "bg-[linear-gradient(180deg,rgba(10,17,14,0.62),rgba(8,13,11,0.76))]",
        className
      )}
    >
      {content}
    </div>
  );
}

function buildColumns<Row extends TransactionTableRow>(
  columns: TransactionTableColumn[],
  variant: TransactionTableVariant,
  renderColumnCell?: RenderColumnCell<Row>
): ColumnDef<Row>[] {
  const labels = getTransactionTableColumnLabels(columns);

  return columns.map((column, index): ColumnDef<Row> => {
    const header = labels[index] ?? column;
    const meta = {
      sortable:
        column === "timestamp" || column === "amount"
          ? column
          : undefined,
      align: column === "amount" ? "right" : "left",
      widthClassName: getColumnWidthClassName(column, columns, variant),
    } satisfies ColumnMeta;

    return {
      id: column,
      accessorKey: column,
      header,
      meta,
      cell: ({ row }) =>
        renderColumnCell?.[column]?.(row.original) ??
        renderDefaultCell(column, row.original, variant),
    };
  });
}

function renderDefaultCell(
  column: TransactionTableColumn,
  row: TransactionTableRow,
  variant: TransactionTableVariant
) {
  switch (column) {
    case "timestamp":
      return (
        <div className="min-w-0">
          <p className="font-medium text-foreground">
            {formatTransactionDateLabel(row.timestamp)}
          </p>
          <p className="mt-1 text-xs text-secondary-foreground/85">
            {formatTransactionTimeLabel(row.timestamp)}
          </p>
        </div>
      );
    case "recipient":
      return (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{row.recipient ?? "-"}</p>
          {variant === "compact" && row.category ? (
            <p className="mt-0.5 truncate text-xs text-secondary-foreground">
              {row.category}
            </p>
          ) : null}
        </div>
      );
    case "amount":
      return (
        <div className="text-right font-semibold tabular-nums text-foreground">
          {formatTransactionAmount(row.amount)}
        </div>
      );
    case "category":
      return <CategoryBadge value={row.category} />;
    case "subcategory":
      return (
        <div className="truncate font-medium text-secondary-foreground">
          {row.subcategory ?? "-"}
        </div>
      );
    case "source":
      return <div className="font-medium text-secondary-foreground">{row.source ?? "-"}</div>;
    case "status":
      return (
        <div
          className={cn(
            "font-medium",
            row.status === "uncategorized" ? "text-accent" : "text-secondary-foreground"
          )}
        >
          {row.status === "uncategorized" ? "Needs review" : "Set"}
        </div>
      );
  }
}

export function CategoryBadge({ value }: { value: string | null }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-11 max-w-full items-center rounded-[999px] border px-3 text-sm font-medium",
        value
          ? "border-primary/20 bg-primary/10 text-primary"
          : "border-accent/30 bg-[rgba(41,36,18,0.78)] text-accent"
      )}
    >
      <span className="truncate">{value ?? "Uncategorized"}</span>
    </span>
  );
}

function getTableMinWidth(
  columns: TransactionTableColumn[],
  variant: TransactionTableVariant
) {
  if (variant === "compact" && columns.length <= 3) {
    return "min-w-0";
  }

  if (variant !== "full") {
    return "min-w-[760px]";
  }

  return columns.includes("recipient") ? "min-w-[860px]" : "min-w-[720px]";
}

function getColumnWidthClassName(
  column: TransactionTableColumn,
  columns: TransactionTableColumn[],
  variant: TransactionTableVariant
) {
  if (variant === "compact" && columns.length === 3) {
    const widths: Partial<Record<TransactionTableColumn, string>> = {
      recipient: "w-[45%]",
      timestamp: "w-[31%]",
      amount: "w-[24%]",
    };
    return widths[column];
  }

  if (!columns.includes("recipient")) {
    const widths: Partial<Record<TransactionTableColumn, string>> = {
      timestamp: "w-[24%]",
      amount: "w-[18%]",
      category: "w-[29%]",
      subcategory: "w-[29%]",
      source: "w-[14%]",
      status: "w-[14%]",
    };
    return widths[column];
  }

  const widths: Partial<Record<TransactionTableColumn, string>> = {
    timestamp: "w-[20%]",
    recipient: "w-[30%]",
    amount: "w-[16%]",
    category: columns.includes("subcategory") ? "w-[17%]" : "w-[22%]",
    subcategory: "w-[17%]",
    source: "w-[12%]",
    status: "w-[10%]",
  };
  return widths[column];
}
