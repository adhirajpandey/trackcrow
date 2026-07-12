import {
  AppPageHeaderSkeleton,
  MobilePageHeaderSkeleton,
} from "@/components/product/page-loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionCreateLoading() {
  return (
    <div className="space-y-3.5">
      <MobilePageHeaderSkeleton
        titleWidth="w-52"
        descriptionWidth="w-[18rem]"
      />
      <div className="hidden lg:block">
        <AppPageHeaderSkeleton
          eyebrowWidth="w-44"
          titleWidth="w-72"
          descriptionWidth="w-[34rem]"
          actionWidths={["w-44", "w-44"]}
        />
      </div>
      <div className="grid gap-3 2xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.72fr)]">
        <div className="space-y-3">
          {[3, 2, 4].map((count, section) => (
            <section
              key={section}
              className="rounded-[8px] border border-border/55 bg-background/12 p-5"
            >
              <Skeleton className="h-6 w-40 rounded-[8px]" />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {Array.from({ length: count }).map((_, index) => (
                  <Skeleton key={index} className="h-16 rounded-[8px]" />
                ))}
              </div>
            </section>
          ))}
        </div>
        <Skeleton className="hidden h-64 rounded-[8px] 2xl:block" />
      </div>
    </div>
  );
}
