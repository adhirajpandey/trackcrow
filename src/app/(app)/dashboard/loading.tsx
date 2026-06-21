import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-3 border-b border-border/70 pb-5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-11 w-56 max-w-full" />
        <Skeleton className="h-5 w-40 max-w-full" />
        <Skeleton className="h-5 w-[30rem] max-w-full" />
      </div>
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.72fr)]">
        <Skeleton className="h-[420px] rounded-2xl" />
        <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-1">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)]">
        <Skeleton className="h-[360px] rounded-2xl" />
        <Skeleton className="h-[360px] rounded-2xl" />
      </div>
      <Skeleton className="h-[280px] rounded-2xl" />
    </div>
  );
}
