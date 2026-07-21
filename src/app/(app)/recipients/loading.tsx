import { DataTableShell } from "@/components/product/data-table-shell";
import {
  AppPageHeaderSkeleton,
  DataTableSkeleton,
  FilterPanelSkeleton,
  MobilePageHeaderSkeleton,
  MobilePaginationSkeleton,
  MobileSearchBarSkeleton,
} from "@/components/product/page-loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

function MobileRecipientCardSkeleton() {
  return (
    <div className="rounded-[10px] border-2 border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-4/5 rounded-[8px]" />
          <Skeleton className="h-4 w-3/5 rounded-[8px]" />
        </div>
        <Skeleton className="h-11 w-20 rounded-[999px]" />
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <Skeleton className="h-4 w-20 rounded-[8px]" />
        <Skeleton className="h-5 w-24 rounded-[8px]" />
      </div>
    </div>
  );
}

export default function RecipientsLoading() {
  return (
    <div className="space-y-3.5">
      <MobilePageHeaderSkeleton
        titleWidth="w-40"
        descriptionWidth="w-[20rem]"
        showEyebrow
        eyebrowWidth="w-32"
      />

      <div className="hidden lg:block">
        <AppPageHeaderSkeleton
          eyebrowWidth="w-40"
          titleWidth="w-56"
          descriptionWidth="w-[38rem]"
        />
      </div>

      <section className="space-y-3 lg:hidden">
        <MobileSearchBarSkeleton />
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <Skeleton className="h-11 w-56 max-w-full rounded-[8px]" />
          <Skeleton className="h-4 w-24 rounded-[8px]" />
        </div>
      </section>

      <div className="hidden lg:block">
        <FilterPanelSkeleton
          controlCount={4}
          controlClassNames={["", "", "", "flex items-center justify-end"]}
          desktopBreakpoint="lg"
          desktopGridClassName="lg:grid-cols-[minmax(16rem,1fr)_13rem_13rem_3rem]"
        />
      </div>

      <DataTableShell>
        <div className="grid gap-3 p-4 lg:hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <MobileRecipientCardSkeleton key={index} />
          ))}
        </div>

        <div className="hidden lg:block">
          <DataTableSkeleton
            columns={[
              { className: "w-[28%]" },
              { className: "w-[40%]" },
              { className: "w-[14%]", align: "right" },
              { className: "w-[18%]", align: "right" },
            ]}
            minWidth="min-w-[920px]"
            mobileBreakpoint="lg"
            includeShell={false}
          />
        </div>

        <div className="flex flex-col gap-4 border-t border-border/45 px-4 py-4 sm:px-5 lg:hidden">
          <Skeleton className="h-5 w-40 rounded-[8px]" />
          <MobilePaginationSkeleton />
        </div>
      </DataTableShell>
    </div>
  );
}
