"use client";
import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

interface ColumnMeta {
  thClassName?: string;
  tdClassName?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  onRowClick?: (row: T) => void;
  rowClassName?: string | ((row: T) => string);
}

export function DataTable<T>({ columns, data, onRowClick, rowClassName }: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full overflow-auto">
      <table className="w-full table-auto">
        <thead className="text-muted-foreground text-sm">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const meta = header.column.columnDef.meta as
                  | ColumnMeta
                  | undefined;
                const thClass =
                  meta?.thClassName ??
                  "text-left py-2 px-4 font-medium text-sm";
                return (
                  <th key={header.id} className={thClass}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const orig = row.original as T;
            const extraClass =
              typeof rowClassName === "function"
                ? rowClassName(orig)
                : rowClassName || "";
            const clickable = Boolean(onRowClick);
            const cls = `hover:bg-accent/40 ${clickable ? "cursor-pointer" : ""} ${extraClass}`.trim();
            const handleClick = () => {
              if (onRowClick) onRowClick(orig);
            };
            const handleKeyDown: React.KeyboardEventHandler<HTMLTableRowElement> = (e) => {
              if (!onRowClick) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onRowClick(orig);
              }
            };
            return (
              <tr
                key={row.id}
                className={cls}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                tabIndex={onRowClick ? 0 : -1}
                role={onRowClick ? "button" : undefined}
              >
              {row.getVisibleCells().map((cell) => {
                const meta = cell.column.columnDef.meta as
                  | ColumnMeta
                  | undefined;
                const tdClass = meta?.tdClassName ?? "py-3 px-4 align-top";
                return (
                  <td key={cell.id} className={tdClass}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
