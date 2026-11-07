import { AppPageHeaderSkeleton, MobilePageHeaderSkeleton } from "@/components/product/page-loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { dashboardPanelClassName } from "./_components/dashboard-style";

export default function DashboardLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading dashboard">
      <div className="lg:hidden">
        <MobilePageHeaderSkeleton titleWidth="w-40" metaWidth="w-56" />
        <Skeleton className="mt-4 h-11 w-full rounded-[8px]" />
      </div>
      <div className="hidden lg:block">
        <AppPageHeaderSkeleton eyebrowWidth="w-36" titleWidth="w-64" metaWidth="w-56" actionWidths={["w-[236px]", "w-[150px]"]} />
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,1.15fr)]">
        <div className={cn(dashboardPanelClassName, "grid grid-cols-2 gap-4 p-5 sm:grid-cols-3")}>
          {[0, 1, 2].map((index) => (
            <div key={index} className={cn(index === 0 && "col-span-2 sm:col-span-1")}>
              <Skeleton className="h-3 w-24 rounded-[8px]" />
              <Skeleton className="mt-3 h-8 w-32 rounded-[8px]" />
              <Skeleton className="mt-3 h-4 w-40 max-w-full rounded-[8px]" />
            </div>
          ))}
        </div>
        <div className={cn(dashboardPanelClassName, "p-5")}>
          <Skeleton className="h-3 w-24 rounded-[8px]" />
          <Skeleton className="mt-3 h-8 w-20 rounded-[8px]" />
          <Skeleton className="mt-4 h-10 w-48 rounded-[8px]" />
        </div>
      </div>
      <Skeleton className="h-11 w-56 rounded-[8px]" />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className={cn(dashboardPanelClassName, "p-5")}>
          <Skeleton className="h-5 w-40 rounded-[8px]" />
          <div className="mt-4 grid grid-cols-7 gap-1.5">
            {Array.from({ length: 35 }, (_, index) => <Skeleton key={index} className="h-[52px] rounded-[6px] sm:h-[84px]" />)}
          </div>
        </div>
        <div className={cn(dashboardPanelClassName, "p-5")}>
          <Skeleton className="h-6 w-36 rounded-[8px]" />
          {[0, 1, 2, 3, 4].map((index) => <Skeleton key={index} className="mt-4 h-10 w-full rounded-[8px]" />)}
        </div>
      </div>
    </div>
  );
}
