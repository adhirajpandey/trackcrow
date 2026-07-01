import { Skeleton } from "@/components/ui/skeleton";

function DashboardPanelSkeleton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={[
        "overflow-hidden rounded-[8px] border border-border/55",
        "bg-[linear-gradient(180deg,rgba(12,22,17,0.94),rgba(9,16,13,0.96))]",
        "shadow-[0_8px_24px_rgba(0,0,0,0.16)]",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function TopCardSkeleton() {
  return (
    <div className="flex min-h-[236px] flex-col rounded-[8px] border border-border/55 bg-[linear-gradient(180deg,rgba(12,22,17,0.94),rgba(9,16,13,0.96))] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.16)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-11 w-11 rounded-[8px]" />
      </div>
      <div className="mt-5 space-y-2.5">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="mt-5 space-y-2.5 border-t border-border/35 pt-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-10 justify-self-end" />
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16 justify-self-end" />
        </div>
      </div>
      <div className="mt-auto pt-5">
        <Skeleton className="h-10 w-full rounded-[8px] sm:w-40" />
      </div>
    </div>
  );
}

function TablePanelSkeleton({
  titleWidth,
  rows,
  minHeightClass = "min-h-[470px]",
}: {
  titleWidth: string;
  rows: number;
  minHeightClass?: string;
}) {
  return (
    <DashboardPanelSkeleton className={`flex flex-col ${minHeightClass}`}>
      <div className="pb-3">
        <div className="flex items-start justify-between gap-3 px-6 pt-6">
          <div className="min-w-0 space-y-1.5">
            <Skeleton className={`h-5 ${titleWidth}`} />
            <Skeleton className="h-4 w-44" />
          </div>
          <Skeleton className="mt-0.5 h-4 w-4" />
        </div>
      </div>
      <div className="flex flex-1 flex-col px-6 pb-6">
        <div className="flex flex-1 flex-col overflow-hidden rounded-[8px] border border-border/50 bg-background/14">
          <div className="grid grid-cols-3 gap-4 border-b border-border/40 px-5 py-3.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-14 justify-self-end" />
            <Skeleton className="h-3 w-12 justify-self-end" />
          </div>
          <div className="space-y-0">
            {Array.from({ length: rows }).map((_, index) => (
              <div
                key={index}
                className="grid min-h-[60px] grid-cols-3 gap-4 border-t border-border/40 px-5 py-4 first:border-t-0"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[70%]" />
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
                <Skeleton className="h-4 w-16 justify-self-end self-center" />
                <Skeleton className="h-4 w-10 justify-self-end self-center" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardPanelSkeleton>
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-3.5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-40 rounded-[8px]" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-10 w-44 rounded-[8px]" />
      </div>

      <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <TopCardSkeleton key={index} />
        ))}
      </section>

      <DashboardPanelSkeleton>
        <div className="space-y-3 pb-2 px-6 pt-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-2 h-4 w-52" />
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2 xl:min-w-[386px] xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[8px] border border-border/35 bg-background/14 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-2.5 w-2.5 rounded-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="mt-3 h-5 w-16" />
                  <Skeleton className="mt-2 h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="rounded-[8px] border border-border/35 bg-[linear-gradient(180deg,rgba(10,17,14,0.62),rgba(8,13,11,0.76))] px-4 py-4 sm:px-5">
            <div className="grid h-[22rem] min-w-0 grid-cols-[3.15rem_minmax(0,1fr)] gap-2.5 sm:gap-3 sm:h-[24rem] xl:h-[26rem]">
              <div className="grid h-full min-h-0 grid-rows-[3.5rem_minmax(0,1fr)_2.8rem]">
                <div />
                <div className="relative min-h-0">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton
                      key={index}
                      className="absolute right-0 h-3 w-8"
                      style={{ bottom: `${index * 25}%` }}
                    />
                  ))}
                </div>
                <div />
              </div>

              <div className="grid min-w-0 grid-rows-[3.5rem_minmax(0,1fr)_2.8rem]">
                <div />
                <div className="relative min-h-0">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="absolute inset-x-0 border-t border-border/14"
                      style={{ bottom: `${index * 25}%` }}
                    />
                  ))}
                  <div className="grid h-full min-w-0 grid-cols-10 items-end gap-1.5 pr-1 sm:grid-cols-15 sm:gap-2 sm:pr-2 xl:grid-cols-30">
                    {Array.from({ length: 30 }).map((_, index) => (
                      <div key={index} className="flex h-full items-end">
                        <Skeleton
                          className="w-full rounded-[2px]"
                          style={{
                            height: `${[8, 86, 14, 10, 18, 26, 10, 9, 8, 14][index % 10]}%`,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid min-w-0 grid-cols-10 gap-1.5 pr-1 sm:grid-cols-15 sm:gap-2 sm:pr-2 xl:grid-cols-30">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={index}
                      className="col-span-1 flex items-center justify-center pt-1.5"
                    >
                      <Skeleton className="h-6 w-8" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardPanelSkeleton>

      <section className="grid items-stretch gap-3 xl:grid-cols-3">
        <TablePanelSkeleton titleWidth="w-40" rows={5} />
        <TablePanelSkeleton titleWidth="w-36" rows={5} />
        <TablePanelSkeleton titleWidth="w-36" rows={5} />
      </section>

      <DashboardPanelSkeleton className="flex flex-col">
        <div className="pb-3">
          <div className="flex items-start justify-between gap-3 px-6 pt-6">
            <div className="min-w-0 space-y-1.5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="mt-0.5 h-4 w-4" />
          </div>
        </div>
        <div className="flex flex-1 flex-col px-6 pb-6">
          <div className="overflow-hidden rounded-[8px] border border-border/50 bg-background/14">
            <div className="grid grid-cols-4 gap-4 border-b border-border/40 px-5 py-3.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-14 justify-self-end" />
            </div>
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="grid min-h-[72px] grid-cols-4 gap-4 border-t border-border/40 px-5 py-4 first:border-t-0"
              >
                <Skeleton className="h-4 w-[78%] self-center" />
                <Skeleton className="h-4 w-[70%] self-center" />
                <Skeleton className="h-4 w-[58%] self-center" />
                <Skeleton className="h-4 w-16 justify-self-end self-center" />
              </div>
            ))}
          </div>
        </div>
      </DashboardPanelSkeleton>
    </div>
  );
}
