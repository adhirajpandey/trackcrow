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
          {[4, 2, 4].map((count, section) => (
            <section
              key={section}
              className="rounded-[8px] border-2 border-border bg-card p-5"
            >
              <div className="flex items-center gap-2"><Skeleton className="h-6 w-40 rounded-[8px]" />{section > 0 ? <Skeleton className="h-4 w-14 rounded-[8px]" /> : null}</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {Array.from({ length: count }).map((_, index) => (
                  <div key={index} className={index > 1 && section !== 1 ? "hidden lg:block" : ""}><Skeleton className="h-4 w-24 rounded-[8px]" /><Skeleton className="mt-2 h-11 rounded-[8px]" /></div>
                ))}
              </div>
            </section>
          ))}
        </div>
        <Skeleton className="hidden h-64 rounded-[8px] 2xl:block" />
      </div>
      <div className="sticky bottom-0 z-20 -mx-4 grid gap-2 border-t-2 border-border bg-background/96 px-4 pb-4 pt-3 backdrop-blur lg:hidden">
        <Skeleton className="h-11 w-full rounded-[8px]" />
        <Skeleton className="h-11 w-full rounded-[8px]" />
      </div>
    </div>
  );
}
