import {
  AppPageHeaderSkeleton,
  MobilePageHeaderSkeleton,
  MobileSurfaceSkeleton,
} from "@/components/product/page-loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { dashboardPanelClassName } from "@/app/(app)/dashboard/_components/dashboard-style";

function RecipientPanelSkeleton({
  titleWidth,
  descriptionWidth,
  rows,
}: {
  titleWidth: string;
  descriptionWidth?: string;
  rows: number;
}) {
  return (
    <section className={cn(dashboardPanelClassName, "px-5 py-5")}>
      <Skeleton className={cn("h-6 rounded-[8px]", titleWidth)} />
      {descriptionWidth ? (
        <Skeleton className={cn("mt-2 h-4 max-w-full rounded-[8px]", descriptionWidth)} />
      ) : null}
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="rounded-[8px] border-2 border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-24 rounded-[8px]" />
                <Skeleton className="h-5 w-40 max-w-full rounded-[8px]" />
              </div>
              <Skeleton className="h-11 w-11 rounded-[8px]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function RecipientDetailLoading() {
  return (
    <div className="space-y-3">
      <MobilePageHeaderSkeleton
        titleWidth="w-44"
        descriptionWidth="w-[18rem]"
        metaWidth="w-36"
        actionWidth="w-full"
        showEyebrow
        eyebrowWidth="w-32"
      />

      <div className="hidden lg:block">
        <AppPageHeaderSkeleton
          eyebrowWidth="w-40"
          titleWidth="w-56"
          descriptionWidth="w-[34rem]"
          metaWidth="w-56"
          actionWidths={["w-44"]}
        />
      </div>

      <MobileSurfaceSkeleton className="px-4 py-3.5 lg:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Skeleton className="h-4 w-20 rounded-[8px]" />
            <Skeleton className="mt-2 h-8 w-36 rounded-[8px]" />
          </div>
          <Skeleton className="h-8 w-20 rounded-[999px]" />
        </div>
        <div className="mt-3 grid gap-2 border-t border-border/35 pt-3">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-4 w-20 rounded-[8px]" />
            <Skeleton className="h-4 w-24 rounded-[8px]" />
          </div>
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-4 w-20 rounded-[8px]" />
            <Skeleton className="h-4 w-28 rounded-[8px]" />
          </div>
        </div>
      </MobileSurfaceSkeleton>

      <div className="grid gap-3 2xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.78fr)]">
        <main className="order-2 space-y-3 2xl:order-1">
          <section className={cn(dashboardPanelClassName, "px-5 py-5 2xl:hidden")}>
            <Skeleton className="h-6 w-36 rounded-[8px]" />
            <Skeleton className="mt-3 h-8 w-48 rounded-[8px]" />
            <Skeleton className="mt-2 h-4 w-56 max-w-full rounded-[8px]" />
            <Skeleton className="mt-4 h-10 w-full rounded-[8px]" />
          </section>

          <section className={cn(dashboardPanelClassName, "px-5 py-5")}>
            <Skeleton className="h-6 w-40 rounded-[8px]" />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-24 rounded-[8px]" />
                  <Skeleton className="h-11 rounded-[8px]" />
                </div>
              ))}
            </div>
          </section>

          <RecipientPanelSkeleton titleWidth="w-28" descriptionWidth="w-[20rem]" rows={3} />
          <RecipientPanelSkeleton titleWidth="w-40" descriptionWidth="w-[18rem]" rows={3} />
        </main>

        <aside className="order-1 hidden space-y-3 2xl:order-2 2xl:block">
          <section className={cn(dashboardPanelClassName, "px-5 py-5")}>
            <Skeleton className="h-6 w-36 rounded-[8px]" />
            <Skeleton className="mt-3 h-8 w-48 rounded-[8px]" />
            <Skeleton className="mt-2 h-4 w-56 max-w-full rounded-[8px]" />
            <Skeleton className="mt-4 h-10 w-full rounded-[8px]" />
          </section>
        </aside>
      </div>
    </div>
  );
}
