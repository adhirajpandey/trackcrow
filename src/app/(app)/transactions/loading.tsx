import {
  AppPageHeaderSkeleton,
  DataTableSkeleton,
  FilterPanelSkeleton,
  MobilePageHeaderSkeleton,
  MobilePaginationSkeleton,
  MobileSearchBarSkeleton,
} from "@/components/product/page-loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

function MobileTransactionsControlsSkeleton() {
  return (
    <section className="space-y-3 lg:hidden">
      <MobileSearchBarSkeleton />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <Skeleton className="h-11 max-w-full rounded-[8px] w-[12.5rem]" />
        <Skeleton className="h-4 w-28 rounded-[8px]" />
      </div>
    </section>
  );
}

function MobileTransactionsListSkeleton() {
  return (
    <div className="grid gap-3 lg:hidden">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="rounded-[10px] border-2 border-border bg-card px-4 py-3.5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-4/5 rounded-[8px]" />
              <Skeleton className="h-4 w-3/5 rounded-[8px]" />
            </div>
            <Skeleton className="h-5 w-20 rounded-[8px]" />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <Skeleton className="h-11 w-24 rounded-[999px]" />
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
      <MobilePageHeaderSkeleton
        titleWidth="w-48"
        descriptionWidth="w-[18rem]"
        actionWidth="w-full"
        showEyebrow
        eyebrowWidth="w-36"
      />

      <div className="hidden lg:block">
        <AppPageHeaderSkeleton
          eyebrowWidth="w-44"
          titleWidth="w-64"
          descriptionWidth="w-[34rem]"
          actionWidths={["w-56", "w-44"]}
        />
      </div>

      <MobileTransactionsControlsSkeleton />

      <div className="hidden lg:block">
        <FilterPanelSkeleton
          controlCount={5}
          controlClassNames={["", "", "", "", "flex items-center lg:justify-end"]}
          desktopBreakpoint="lg"
          desktopGridClassName="lg:grid-cols-[minmax(16rem,1fr)_minmax(10rem,0.25fr)_minmax(10rem,0.25fr)_minmax(10rem,0.25fr)_3rem]"
        />
      </div>

      <MobileTransactionsListSkeleton />

      <div className="hidden lg:block">
        <DataTableSkeleton
          columns={[
            { className: "w-[20%]" },
            { className: "w-[30%]" },
            { className: "w-[16%]", align: "right" },
            { className: "w-[17%]" },
            { className: "w-[14%]" },
            { className: "w-[17%]" },
          ]}
          minWidth="min-w-[860px]"
          mobileBreakpoint="lg"
        />
      </div>

      <MobilePaginationSkeleton />
    </div>
  );
}
