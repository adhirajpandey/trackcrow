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
}

export function DataTable<T>({ columns, data }: DataTableProps<T>) {
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
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-accent/40">
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
