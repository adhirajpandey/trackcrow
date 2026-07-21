import {
  AppPageHeaderSkeleton,
  DataTableSkeleton,
  MobilePageHeaderSkeleton,
} from "@/components/product/page-loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function RulesLoading() {
  return (
    <div className="space-y-3.5">
      <MobilePageHeaderSkeleton
        showEyebrow
        eyebrowWidth="w-32"
        titleWidth="w-28"
        descriptionWidth="w-full"
      />
      <div className="hidden lg:block">
        <AppPageHeaderSkeleton
          eyebrowWidth="w-40"
          titleWidth="w-40"
          descriptionWidth="w-[32rem]"
          actionWidths={["w-32"]}
        />
      </div>
      <Skeleton className="h-11 w-full rounded-[8px] lg:hidden" />
      <section className="space-y-3 lg:hidden">
        <Skeleton className="h-12 w-full rounded-[8px]" />
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <Skeleton className="h-11 w-52 max-w-full rounded-[8px]" />
          <Skeleton className="h-4 w-16 rounded-[8px]" />
        </div>
      </section>

      <div className="hidden gap-3 lg:grid lg:grid-cols-[minmax(16rem,1fr)_12rem_3rem]">
        <Skeleton className="h-12 w-full rounded-[8px]" />
        <Skeleton className="h-12 w-full rounded-[8px]" />
        <Skeleton className="h-12 w-12 rounded-[8px]" />
      </div>

      <div className="grid gap-3 lg:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-[10px] border-2 border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-3/5 rounded-[8px]" />
                <Skeleton className="h-4 w-2/5 rounded-[8px]" />
              </div>
              <Skeleton className="h-9 w-24 rounded-[999px]" />
            </div>
            <Skeleton className="mt-3 h-4 w-36 rounded-[8px]" />
            <div className="mt-3 flex justify-end">
              <Skeleton className="h-10 w-20 rounded-[8px]" />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden lg:block">
        <DataTableSkeleton
          rowCount={6}
          mobileRowCount={0}
          includeFooter={false}
          columns={[
            { className: "w-[20%]" },
            { className: "w-[24%]" },
            { className: "w-[26%]" },
            { className: "w-[16%]" },
            { className: "w-[14%]", align: "right" },
          ]}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-20 rounded-[8px]" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-[8px]" />
          <Skeleton className="h-10 w-16 rounded-[8px]" />
        </div>
      </div>
    </div>
  );
}
