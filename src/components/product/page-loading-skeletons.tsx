import { DataTableShell } from "@/components/product/data-table-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  dashboardInnerTableClassName,
  dashboardPanelClassName,
} from "@/app/(app)/dashboard/_components/dashboard-style";

type TableSkeletonColumn = {
  className?: string;
  align?: "left" | "right";
};

const defaultTableColumns: TableSkeletonColumn[] = [
  { className: "w-[20%]" },
  { className: "w-[30%]" },
  { className: "w-[16%]", align: "right" },
  { className: "w-[22%]" },
  { className: "w-[12%]" },
];

export function WorkspaceListPageSkeleton({
  eyebrowWidth = "w-36",
  titleWidth = "w-64",
  descriptionWidth = "w-[32rem]",
  filterControlCount = 5,
  tableColumns = defaultTableColumns,
  tableMinWidth = "min-w-[860px]",
}: {
  eyebrowWidth?: string;
  titleWidth?: string;
  descriptionWidth?: string;
  filterControlCount?: number;
  tableColumns?: TableSkeletonColumn[];
  tableMinWidth?: string;
}) {
  return (
    <div className="space-y-3.5">
      <PageHeaderSkeleton
        eyebrowWidth={eyebrowWidth}
        titleWidth={titleWidth}
        descriptionWidth={descriptionWidth}
      />
      <FilterPanelSkeleton controlCount={filterControlCount} />
      <DataTableSkeleton columns={tableColumns} minWidth={tableMinWidth} />
    </div>
  );
}

export function WorkspaceDetailPageSkeleton({
  formLayout = false,
}: {
  formLayout?: boolean;
}) {
  return (
    <div className="space-y-3.5">
      <PageHeaderSkeleton
        eyebrowWidth="w-40"
        titleWidth="w-72"
        descriptionWidth="w-[38rem]"
        actionWidths={["w-44", ...(formLayout ? ["w-40"] : [])]}
      />

      <div className="grid gap-3 2xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.78fr)]">
        <div className="space-y-3">
          <SummaryPanelSkeleton />
          {formLayout ? (
            <>
              <FormPanelSkeleton titleWidth="w-36" fieldCount={2} />
              <FormPanelSkeleton titleWidth="w-28" fieldCount={4} />
              <FormPanelSkeleton titleWidth="w-32" fieldCount={6} hasTextarea />
            </>
          ) : (
            <>
              <InnerTablePanelSkeleton columns={3} />
              <InnerTablePanelSkeleton columns={3} />
              <InnerTablePanelSkeleton columns={5} />
            </>
          )}
        </div>

        <aside className="space-y-3">
          <SidePanelSkeleton rows={5} />
          <SidePanelSkeleton rows={3} tallRows />
          <SidePanelSkeleton rows={3} tallRows />
          {formLayout ? <SidePanelSkeleton rows={2} tallRows /> : null}
        </aside>
      </div>
    </div>
  );
}

export function PageHeaderSkeleton({
  eyebrowWidth,
  titleWidth,
  descriptionWidth,
  actionWidths = [],
}: {
  eyebrowWidth: string;
  titleWidth: string;
  descriptionWidth: string;
  actionWidths?: string[];
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 space-y-3">
        <Skeleton className={cn("h-4 rounded-[8px]", eyebrowWidth)} />
        <Skeleton className={cn("h-12 max-w-full rounded-[8px]", titleWidth)} />
        <Skeleton className={cn("h-5 max-w-full rounded-[8px]", descriptionWidth)} />
      </div>
      {actionWidths.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {actionWidths.map((width, index) => (
            <Skeleton key={`${width}-${index}`} className={cn("h-10 rounded-[8px]", width)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function FilterPanelSkeleton({ controlCount = 5 }: { controlCount?: number }) {
  return (
    <section className="rounded-[8px] border border-border/55 bg-[linear-gradient(180deg,rgba(12,22,17,0.94),rgba(9,16,13,0.96))] px-4 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.16)] sm:px-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: controlCount }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-[8px]" />
            <Skeleton className="h-11 rounded-[8px]" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function DataTableSkeleton({
  columns = defaultTableColumns,
  rowCount = 8,
  mobileRowCount = 5,
  minWidth = "min-w-[860px]",
}: {
  columns?: TableSkeletonColumn[];
  rowCount?: number;
  mobileRowCount?: number;
  minWidth?: string;
}) {
  return (
    <DataTableShell>
      <div className="grid gap-3 p-4 md:hidden">
        {Array.from({ length: mobileRowCount }).map((_, index) => (
          <div
            key={index}
            className="rounded-[8px] border border-border/45 bg-background/12 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-4/5 rounded-[8px]" />
                <Skeleton className="h-4 w-3/5 rounded-[8px]" />
              </div>
              <Skeleton className="h-5 w-20 rounded-[8px]" />
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <Skeleton className="h-8 w-32 rounded-[999px]" />
              <Skeleton className="h-4 w-16 rounded-[8px]" />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <div className={cn("w-full", minWidth)}>
            <div className="flex border-b border-border/40 bg-background/16">
              {columns.map((column, index) => (
                <div
                  key={index}
                  className={cn(
                    "px-5 py-3.5",
                    column.className,
                    column.align === "right" && "flex justify-end"
                  )}
                >
                  <Skeleton className="h-3 w-24 rounded-[8px]" />
                </div>
              ))}
            </div>
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
              <div key={rowIndex} className="flex border-b border-border/40">
                {columns.map((column, columnIndex) => (
                  <div
                    key={columnIndex}
                    className={cn(
                      "px-5 py-4",
                      column.className,
                      column.align === "right" && "flex justify-end"
                    )}
                  >
                    <Skeleton
                      className={cn(
                        "h-5 rounded-[8px]",
                        columnIndex === 0 && "w-28",
                        columnIndex === 1 && "w-48",
                        columnIndex === 2 && "w-24",
                        columnIndex === 3 && "w-32 rounded-[999px]",
                        columnIndex >= 4 && "w-20"
                      )}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-border/45 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <Skeleton className="h-5 w-52 rounded-[8px]" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-9 rounded-[8px]" />
          ))}
        </div>
      </div>
    </DataTableShell>
  );
}

function SummaryPanelSkeleton() {
  return (
    <section className={cn(dashboardPanelClassName, "px-5 py-5")}>
      <div className="grid gap-5 xl:grid-cols-[minmax(240px,0.95fr)_minmax(0,1fr)_minmax(0,0.85fr)]">
        <div className="space-y-3">
          <Skeleton className="h-5 w-36 rounded-[8px]" />
          <Skeleton className="h-10 w-64 max-w-full rounded-[8px]" />
          <Skeleton className="h-5 w-72 max-w-full rounded-[8px]" />
        </div>
        <DefinitionGridSkeleton />
        <DefinitionGridSkeleton />
      </div>
    </section>
  );
}

function DefinitionGridSkeleton() {
  return (
    <div className="grid gap-3 border-l border-border/45 pl-5">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="grid gap-1.5">
          <Skeleton className="h-4 w-28 rounded-[8px]" />
          <Skeleton className="h-5 w-40 max-w-full rounded-[8px]" />
        </div>
      ))}
    </div>
  );
}

function FormPanelSkeleton({
  titleWidth,
  fieldCount,
  hasTextarea = false,
}: {
  titleWidth: string;
  fieldCount: number;
  hasTextarea?: boolean;
}) {
  return (
    <section className={cn(dashboardPanelClassName, "px-5 py-5")}>
      <div className="flex items-center justify-between gap-3">
        <Skeleton className={cn("h-6 rounded-[8px]", titleWidth)} />
        <Skeleton className="h-9 w-36 rounded-[8px]" />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {Array.from({ length: fieldCount }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-[8px]" />
            <Skeleton className="h-11 rounded-[8px]" />
          </div>
        ))}
      </div>
      {hasTextarea ? (
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-20 rounded-[8px]" />
          <Skeleton className="h-28 rounded-[8px]" />
        </div>
      ) : null}
    </section>
  );
}

function InnerTablePanelSkeleton({ columns }: { columns: number }) {
  return (
    <section className={cn(dashboardPanelClassName, "overflow-hidden")}>
      <div className="space-y-1.5 px-5 pb-4 pt-5">
        <Skeleton className="h-6 w-44 rounded-[8px]" />
        <Skeleton className="h-5 w-72 max-w-full rounded-[8px]" />
      </div>
      <div className="overflow-x-auto px-5 pb-5">
        <div className={dashboardInnerTableClassName}>
          <div className="flex min-w-[560px] border-b border-border/40 bg-background/16">
            {Array.from({ length: columns }).map((_, index) => (
              <div key={index} className="flex-1 px-5 py-3.5">
                <Skeleton className="h-3 w-24 rounded-[8px]" />
              </div>
            ))}
          </div>
          {Array.from({ length: 4 }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex min-w-[560px] border-b border-border/40">
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <div key={columnIndex} className="flex-1 px-5 py-4">
                  <Skeleton
                    className={cn(
                      "h-5 rounded-[8px]",
                      columnIndex === 0 ? "w-36" : "w-24"
                    )}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SidePanelSkeleton({
  rows,
  tallRows = false,
}: {
  rows: number;
  tallRows?: boolean;
}) {
  return (
    <section className={cn(dashboardPanelClassName, "px-5 py-5")}>
      <Skeleton className="h-6 w-40 rounded-[8px]" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "rounded-[8px] border border-border/45 bg-background/10 px-3.5 py-3",
              !tallRows && "border-x-0 border-t-0 bg-transparent px-0"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-28 rounded-[8px]" />
              <Skeleton className="h-5 w-32 rounded-[8px]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
