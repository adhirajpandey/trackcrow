import {
  AppPageHeaderSkeleton,
  MobilePageHeaderSkeleton,
} from "@/components/product/page-loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

function FieldSkeleton({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Skeleton className="h-4 w-24 rounded-[8px]" />
      <Skeleton className="mt-2 h-11 w-full rounded-[8px]" />
    </div>
  );
}

function SectionTitleSkeleton({
  optional = false,
  collapsible = false,
}: {
  optional?: boolean;
  collapsible?: boolean;
}) {
  return (
    <div className={collapsible ? "flex min-h-11 items-center justify-between gap-3 lg:min-h-0" : "flex items-center gap-2"}>
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-40 rounded-[8px]" />
        {optional ? <Skeleton className="h-4 w-14 rounded-[8px]" /> : null}
      </div>
      {collapsible ? <Skeleton className="h-4 w-4 rounded-full lg:hidden" /> : null}
    </div>
  );
}

function TransactionSummarySkeleton() {
  return (
    <aside className="hidden h-fit rounded-[8px] border-2 border-border bg-card p-5 2xl:block">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-5 w-40 rounded-[8px]" />
      </div>
      <Skeleton className="mt-5 h-9 w-36 rounded-[8px]" />
      <div className="mt-5 space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-start justify-between gap-3">
            <Skeleton className="h-4 w-24 rounded-[8px]" />
            <Skeleton className="h-4 w-32 rounded-[8px]" />
          </div>
        ))}
      </div>
    </aside>
  );
}

export default function TransactionCreateLoading() {
  return (
    <div className="space-y-3.5 pb-2">
      <MobilePageHeaderSkeleton
        titleWidth="w-52"
        descriptionWidth="w-[18rem]"
        actionWidth="w-full"
      />
      <div className="hidden lg:block">
        <AppPageHeaderSkeleton
          eyebrowWidth="w-44"
          titleWidth="w-72"
          descriptionWidth="w-[34rem]"
          metaWidth="w-24"
          actionWidths={["w-44", "w-44"]}
        />
      </div>

      <div className="grid gap-3 2xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.72fr)]">
        <div className="space-y-3">
          <section className="rounded-[8px] border-2 border-border bg-card p-5">
            <SectionTitleSkeleton />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton className="md:col-span-2" />
              <FieldSkeleton className="md:col-span-2" />
            </div>
          </section>

          <section className="rounded-[8px] border-2 border-border bg-card p-5">
            <SectionTitleSkeleton optional />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
          </section>

          <section className="rounded-[8px] border-2 border-border bg-card p-5">
            <SectionTitleSkeleton optional collapsible />
            <div className="mt-4 hidden gap-4 md:grid-cols-2 lg:grid">
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton className="md:col-span-2" />
              <div className="md:col-span-2">
                <Skeleton className="h-4 w-24 rounded-[8px]" />
                <Skeleton className="mt-2 h-28 w-full rounded-[8px]" />
              </div>
            </div>
          </section>

          <div className="hidden justify-end gap-2 lg:flex">
            <Skeleton className="h-10 w-24 rounded-[8px]" />
            <Skeleton className="h-10 w-44 rounded-[8px]" />
          </div>
        </div>

        <TransactionSummarySkeleton />
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 grid gap-2 border-t-2 border-border bg-background/96 px-4 pb-4 pt-3 backdrop-blur lg:hidden">
        <Skeleton className="h-11 w-full rounded-[8px]" />
        <Skeleton className="h-11 w-full rounded-[8px]" />
      </div>
    </div>
  );
}
