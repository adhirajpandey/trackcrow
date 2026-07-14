import { DataTableShell } from "@/components/product/data-table-shell";
import {
  AppPageHeaderSkeleton,
  DataTableSkeleton,
  FilterPanelSkeleton,
  MobileListCardSkeleton,
  MobilePageHeaderSkeleton,
  MobilePaginationSkeleton,
  MobileSearchSurfaceSkeleton,
} from "@/components/product/page-loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

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

      <MobileSearchSurfaceSkeleton />

      <section className="hidden rounded-[10px] border-2 border-border bg-card px-4 py-4 shadow-[3px_4px_0_var(--foreground)] sm:px-5 lg:block">
        <FilterPanelSkeleton controlCount={1} desktopBreakpoint="lg" />
      </section>

      <DataTableShell>
        <div className="grid gap-3 p-4 lg:hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <MobileListCardSkeleton key={index} badge={false} detailRows={1} />
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
        </div>
      </DataTableShell>

      <MobilePaginationSkeleton />
    </div>
  );
}
