import { DataTableShell } from "@/components/product/data-table-shell";
import {
  DataTableSkeleton,
  FilterPanelSkeleton,
  PageHeaderSkeleton,
} from "@/components/product/page-loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

function MobileTransactionsControlsSkeleton() {
  return (
    <section className="space-y-3 lg:hidden">
      <Skeleton className="h-12 rounded-[8px]" />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <Skeleton className="h-9 max-w-full rounded-[8px] w-[12.5rem]" />
        <Skeleton className="h-4 w-28 rounded-[8px]" />
      </div>
    </section>
  );
}

function MobileTransactionsListSkeleton() {
  return (
    <div className="grid gap-3 md:hidden">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="rounded-[8px] border border-border/45 bg-background/12 px-4 py-3.5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-4/5 rounded-[8px]" />
              <Skeleton className="h-4 w-3/5 rounded-[8px]" />
            </div>
            <Skeleton className="h-5 w-20 rounded-[8px]" />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <Skeleton className="h-7 w-24 rounded-[999px]" />
            <Skeleton className="h-4 w-16 rounded-[8px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TransactionsLoading() {
  return (
    <div className="space-y-3.5">
      <PageHeaderSkeleton
        eyebrowWidth="w-44"
        titleWidth="w-64"
        descriptionWidth="w-[34rem]"
        actionWidths={["w-64", "w-40"]}
      />

      <MobileTransactionsControlsSkeleton />

      <div className="hidden lg:block">
        <FilterPanelSkeleton
          controlCount={4}
          controlClassNames={["", "", "", "flex items-end lg:justify-end"]}
        />
      </div>

      <DataTableShell>
        <MobileTransactionsListSkeleton />

        <div className="hidden md:block">
          <DataTableSkeleton
            columns={[
              { className: "w-[20%]" },
              { className: "w-[30%]" },
              { className: "w-[16%]", align: "right" },
              { className: "w-[22%]" },
              { className: "w-[12%]" },
            ]}
            minWidth="min-w-[860px]"
          />
        </div>
      </DataTableShell>
    </div>
  );
}
