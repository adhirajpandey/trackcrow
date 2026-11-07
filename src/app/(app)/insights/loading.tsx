import { AppPageHeaderSkeleton, MobilePageHeaderSkeleton } from "@/components/product/page-loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { dashboardPanelClassName } from "../dashboard/_components/dashboard-style";

export default function InsightsLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading insights">
      <div className="lg:hidden">
        <MobilePageHeaderSkeleton titleWidth="w-32" metaWidth="w-56" />
        <Skeleton className="mt-4 h-11 w-full rounded-[8px]" />
      </div>
      <div className="hidden lg:block">
        <AppPageHeaderSkeleton eyebrowWidth="w-32" titleWidth="w-52" metaWidth="w-56" actionWidths={["w-[236px]", "w-[150px]"]} />
      </div>
      <Skeleton className={cn(dashboardPanelClassName, "h-14 shadow-none")} />
      <Skeleton className="h-11 w-full rounded-[8px] sm:w-80" />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className={cn(dashboardPanelClassName, "p-5")}>
          <Skeleton className="h-5 w-40 rounded-[8px]" />
          <div className="mt-4 grid grid-cols-7 gap-1.5">
            {Array.from({ length: 35 }, (_, index) => <Skeleton key={index} className="h-[52px] rounded-[6px] sm:h-[84px]" />)}
          </div>
        </div>
        <div className={cn(dashboardPanelClassName, "hidden p-5 xl:block")}>
          <Skeleton className="h-6 w-36 rounded-[8px]" />
          {[0, 1, 2, 3, 4].map((index) => <Skeleton key={index} className="mt-4 h-10 w-full rounded-[8px]" />)}
        </div>
      </div>
    </div>
  );
}
