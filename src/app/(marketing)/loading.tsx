import { Skeleton } from "@/components/ui/skeleton";

export default function MarketingLoading() {
  return (
    <main className="min-h-screen overflow-hidden bg-background px-4 pb-16 pt-4 text-foreground sm:px-6 sm:pt-5 lg:px-8 lg:pb-20">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex items-center justify-between rounded-[10px] border-2 border-border bg-card px-3 py-3 shadow-[3px_4px_0_var(--foreground)] sm:px-4 lg:px-5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-[10px]" />
            <Skeleton className="h-3 w-20 rounded-[8px]" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="hidden h-8 w-64 rounded-[7px] lg:block" />
            <Skeleton className="h-11 w-20 rounded-[7px]" />
            <Skeleton className="hidden h-11 w-36 rounded-[7px] sm:block" />
          </div>
        </header>

        <section className="grid items-center gap-12 pb-4 pt-14 lg:min-h-[calc(100vh-7rem)] lg:grid-cols-[0.88fr_1.12fr] lg:gap-10 lg:pt-20 xl:gap-16">
          <div className="max-w-[660px]">
            <Skeleton className="h-6 w-60 rounded-[8px]" />
            <Skeleton className="mt-5 h-16 w-full max-w-[38rem] rounded-[8px] sm:h-24" />
            <Skeleton className="mt-3 h-16 w-4/5 rounded-[8px] sm:h-24" />
            <Skeleton className="mt-7 h-5 w-full max-w-[39rem] rounded-[8px]" />
            <Skeleton className="mt-3 h-5 w-5/6 rounded-[8px]" />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Skeleton className="h-13 w-full rounded-[7px] sm:w-52" />
              <Skeleton className="h-13 w-full rounded-[7px] sm:w-44" />
            </div>
            <div className="mt-8 flex flex-wrap gap-5 border-t-2 border-dashed border-border/50 pt-5">
              {["w-36", "w-48", "w-52"].map((width) => (
                <Skeleton key={width} className={`h-8 ${width} rounded-[7px]`} />
              ))}
            </div>
          </div>

          <div className="rounded-[12px] border-2 border-border bg-[#fffaf0] p-3 shadow-[8px_9px_0_var(--foreground)] sm:p-5">
            <div className="flex items-center justify-between border-b-2 border-dashed border-border/50 pb-3">
              <div className="space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-4 w-52" /></div>
              <Skeleton className="h-7 w-36 rounded-[999px]" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-24 rounded-[9px] sm:col-span-2 sm:mx-8" />
              {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-[9px]" />)}
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-6 border-y-2 border-border py-16 lg:grid-cols-3">
          <div className="lg:col-span-3 grid gap-6 lg:grid-cols-2"><Skeleton className="h-36 rounded-[8px]" /><Skeleton className="h-24 rounded-[8px]" /></div>
          {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-80 rounded-[10px]" />)}
        </section>
      </div>
    </main>
  );
}
