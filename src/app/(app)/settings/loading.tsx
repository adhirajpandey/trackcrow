import { AppPageHeaderSkeleton } from "@/components/product/page-loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <AppPageHeaderSkeleton
        eyebrowWidth="w-40"
        titleWidth="w-40"
        descriptionWidth="w-[32rem]"
      />

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-[8px]" />
            <Skeleton className="h-4 w-[30rem] max-w-full rounded-[8px]" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-xl bg-muted/26 p-3">
              <Skeleton className="h-4 w-24 rounded-[8px]" />
              <Skeleton className="mt-2 h-4 w-32 rounded-[8px]" />
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-border/70 bg-muted/18 px-4 py-3">
          <Skeleton className="h-4 w-40 rounded-[8px]" />
          <Skeleton className="mt-2 h-4 w-[24rem] max-w-full rounded-[8px]" />
        </div>
      </section>
    </div>
  );
}
