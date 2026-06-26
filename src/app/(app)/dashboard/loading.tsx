import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-56 max-w-full rounded-[8px]" />
          <Skeleton className="h-5 w-60 max-w-full" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-64 rounded-[8px]" />
          <Skeleton className="h-9 w-36 rounded-[8px]" />
        </div>
      </div>

      <Skeleton className="h-12 rounded-[8px]" />

      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[132px] rounded-[8px]" />
        ))}
      </div>

      <div className="grid gap-3 2xl:grid-cols-[minmax(0,1.58fr)_minmax(320px,0.72fr)]">
        <Skeleton className="h-[420px] rounded-[8px]" />
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-[8px]" />
          ))}
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[320px] rounded-[8px]" />
        ))}
      </div>
    </div>
  );
}
