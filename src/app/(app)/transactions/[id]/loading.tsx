import {
  AppPageHeaderSkeleton,
  MobilePageHeaderSkeleton,
  MobileSurfaceSkeleton,
} from "@/components/product/page-loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  dashboardAttentionPanelClassName,
  dashboardPanelClassName,
} from "@/app/(app)/dashboard/_components/dashboard-style";

function DetailPanelSkeleton({
  titleWidth,
  rows,
  textarea = false,
  actionWidth,
  tone = "default",
}: {
  titleWidth: string;
  rows: number;
  textarea?: boolean;
  actionWidth?: string;
  tone?: "default" | "attention";
}) {
  return (
    <section
      className={cn(
        tone === "attention" ? dashboardAttentionPanelClassName : dashboardPanelClassName,
        "px-5 py-5"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className={cn("h-6 rounded-[8px]", titleWidth)} />
          <Skeleton className="h-8 w-28 rounded-[999px]" />
        </div>
        {actionWidth ? <Skeleton className={cn("h-10 rounded-[8px]", actionWidth)} /> : null}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-[8px]" />
            <Skeleton className="h-11 rounded-[8px]" />
          </div>
        ))}
        {textarea ? (
          <div className="space-y-2 md:col-span-2">
            <Skeleton className="h-4 w-24 rounded-[8px]" />
            <Skeleton className="h-28 rounded-[8px]" />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function DangerZoneSkeleton({ mobile = false }: { mobile?: boolean }) {
  return (
    <section
      className={cn(
        dashboardPanelClassName,
        mobile ? "px-4 py-3 lg:hidden" : "hidden px-5 py-5 lg:block"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-6 w-32 rounded-[8px]" />
        {mobile ? <Skeleton className="h-4 w-4 rounded-full" /> : null}
      </div>
      {!mobile ? (
        <>
          <Skeleton className="mt-3 h-4 w-64 max-w-full rounded-[8px]" />
          <Skeleton className="mt-4 h-10 w-full rounded-[8px]" />
        </>
      ) : null}
    </section>
  );
}

export default function TransactionDetailLoading() {
  return (
    <div className="space-y-3.5">
      <MobilePageHeaderSkeleton
        titleWidth="w-48"
        metaWidth="w-24"
        actionWidth="w-full"
        showEyebrow
        eyebrowWidth="w-36"
      />

      <div className="hidden lg:block">
        <AppPageHeaderSkeleton
          eyebrowWidth="w-44"
          titleWidth="w-72"
          descriptionWidth="w-[34rem]"
          metaWidth="w-28"
          actionWidths={["w-44", "w-40"]}
        />
      </div>

      <MobileSurfaceSkeleton className="px-4 py-3.5 lg:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Skeleton className="h-4 w-16 rounded-[8px]" />
            <Skeleton className="mt-2 h-8 w-36 rounded-[8px]" />
          </div>
          <Skeleton className="h-8 w-16 rounded-[999px]" />
        </div>
        <div className="mt-3 grid gap-2 border-t border-border/35 pt-3">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-4 w-24 rounded-[8px]" />
            <Skeleton className="h-4 w-28 rounded-[8px]" />
          </div>
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-4 w-16 rounded-[8px]" />
            <Skeleton className="h-4 w-32 rounded-[8px]" />
          </div>
        </div>
      </MobileSurfaceSkeleton>

      <div className="grid gap-3 2xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.78fr)]">
        <div className="space-y-3">
          <DetailPanelSkeleton titleWidth="w-32" rows={2} actionWidth="w-36" tone="attention" />
          <DetailPanelSkeleton titleWidth="w-40" rows={6} textarea />
          <DangerZoneSkeleton mobile />
        </div>
        <aside className="space-y-3">
          <DangerZoneSkeleton />
        </aside>
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 border-t border-border/60 bg-background/96 px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <Skeleton className="h-10 w-full rounded-[8px]" />
      </div>
    </div>
  );
}
