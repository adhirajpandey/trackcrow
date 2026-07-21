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
  secondaryActionWidth,
  tone = "default",
  collapsibleDetails = false,
}: {
  titleWidth: string;
  rows: number;
  textarea?: boolean;
  actionWidth?: string;
  secondaryActionWidth?: string;
  tone?: "default" | "attention";
  collapsibleDetails?: boolean;
}) {
  return (
    <section
      className={cn(
        tone === "attention" ? dashboardAttentionPanelClassName : dashboardPanelClassName,
        "px-5 py-5"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className={cn("h-6 rounded-[8px]", titleWidth)} />
          {tone === "attention" ? (
            <>
              <Skeleton className="h-9 w-24 rounded-[999px]" />
              <Skeleton className="h-9 w-28 rounded-[999px]" />
            </>
          ) : null}
        </div>
        {actionWidth || secondaryActionWidth ? (
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            {actionWidth ? <Skeleton className={cn("h-10 rounded-[8px]", actionWidth)} /> : null}
            {secondaryActionWidth ? (
              <Skeleton className={cn("h-10 rounded-[8px]", secondaryActionWidth)} />
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "space-y-2",
              collapsibleDetails && [2, 3, 5].includes(index) && "hidden lg:block",
              collapsibleDetails && index === 6 && "md:col-span-2"
            )}
          >
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
      {tone === "attention" ? (
        <Skeleton className="mt-3 h-4 w-[34rem] max-w-full rounded-[8px]" />
      ) : null}
      {collapsibleDetails ? (
        <div className="mt-4 lg:hidden">
          <Skeleton className="h-11 w-full rounded-[8px]" />
        </div>
      ) : null}
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

function TransactionSummarySkeleton() {
  return (
    <section className={cn(dashboardPanelClassName, "bg-[var(--paper-mint)] px-5 py-5")}>
      <Skeleton className="h-4 w-24 rounded-[8px]" />
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16 rounded-[8px]" />
          <Skeleton className="h-8 w-36 rounded-[8px]" />
        </div>
        <Skeleton className="h-8 w-16 rounded-[999px]" />
      </div>
      <div className="mt-4 grid gap-3 border-t-2 border-border/60 pt-3">
        <Skeleton className="h-4 w-full rounded-[8px]" />
        <Skeleton className="h-4 w-full rounded-[8px]" />
      </div>
    </section>
  );
}

export default function TransactionDetailLoading() {
  return (
    <div className="space-y-3.5">
      <MobilePageHeaderSkeleton
        titleWidth="w-48"
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

      <MobileSurfaceSkeleton className="bg-[var(--paper-mint)] px-4 py-3.5 lg:hidden">
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
          <DetailPanelSkeleton
            titleWidth="w-32"
            rows={2}
            actionWidth="w-36"
            secondaryActionWidth="w-28"
            tone="attention"
          />
          <DetailPanelSkeleton
            titleWidth="w-40"
            rows={7}
            textarea
            collapsibleDetails
          />
          <DangerZoneSkeleton mobile />
        </div>
        <aside className="hidden space-y-3 lg:block">
          <TransactionSummarySkeleton />
          <DangerZoneSkeleton />
        </aside>
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 border-t-2 border-border bg-background/96 px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <Skeleton className="h-10 w-full rounded-[8px]" />
      </div>
    </div>
  );
}
