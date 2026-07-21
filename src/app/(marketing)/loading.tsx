import { Skeleton } from "@/components/ui/skeleton";

function SectionHeadingSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
      <div>
        <Skeleton className="h-5 w-56 rounded-[8px]" />
        <Skeleton className="mt-4 h-3 w-32 rounded-[8px]" />
        <Skeleton className="mt-4 h-14 w-full max-w-[32rem] rounded-[8px] sm:h-24" />
      </div>
      <div className="space-y-3 lg:justify-self-end">
        <Skeleton className="h-5 w-full max-w-[36rem] rounded-[8px]" />
        <Skeleton className="h-5 w-[28rem] max-w-full rounded-[8px]" />
      </div>
    </div>
  );
}

function WorkflowCardSkeleton() {
  return (
    <div className="flex min-h-[320px] flex-col rounded-[10px] border-2 border-border bg-card p-6 shadow-[5px_6px_0_var(--foreground)]">
      <div className="flex items-center justify-between">
        <Skeleton className="h-12 w-12 rounded-[8px]" />
        <Skeleton className="h-12 w-14 rounded-[8px]" />
      </div>
      <Skeleton className="mt-7 h-3 w-20 rounded-[8px]" />
      <Skeleton className="mt-3 h-14 w-4/5 rounded-[8px]" />
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full rounded-[8px]" />
        <Skeleton className="h-4 w-5/6 rounded-[8px]" />
      </div>
      <Skeleton className="mt-auto h-5 w-40 rounded-[8px]" />
    </div>
  );
}

export default function MarketingLoading() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="px-4 pb-16 pt-4 sm:px-6 sm:pt-5 lg:min-h-screen lg:px-8 lg:pb-20">
        <div className="mx-auto max-w-[1440px]">
          <header className="flex min-h-[72px] items-center justify-between gap-3 rounded-[10px] border-2 border-border bg-card px-3 py-2.5 shadow-[3px_4px_0_var(--foreground)] sm:px-4 lg:px-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-[12px]" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded-[8px]" />
                <Skeleton className="hidden h-3 w-32 rounded-[8px] sm:block" />
              </div>
            </div>
            <Skeleton className="hidden h-3 w-60 rounded-[8px] md:block" />
            <Skeleton className="h-13 w-24 rounded-[7px] sm:w-40" />
          </header>

          <div className="grid items-center gap-12 pb-3 pt-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:pt-14 xl:gap-16">
            <div className="max-w-[620px]">
              <Skeleton className="h-6 w-64 max-w-full rounded-[8px]" />
              <Skeleton className="mt-5 h-32 w-full rounded-[8px] sm:h-44" />
              <div className="mt-7 space-y-3">
                <Skeleton className="h-5 w-full rounded-[8px]" />
                <Skeleton className="h-5 w-5/6 rounded-[8px]" />
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Skeleton className="h-13 w-full rounded-[7px] sm:w-52" />
                <Skeleton className="h-13 w-full rounded-[7px] sm:w-44" />
              </div>
              <div className="mt-7 grid gap-3 border-t-2 border-dashed border-border/50 pt-5 sm:grid-cols-2">
                <Skeleton className="h-8 w-48 rounded-[8px]" />
                <Skeleton className="h-8 w-56 max-w-full rounded-[8px]" />
              </div>
            </div>

            <div className="rounded-[12px] border-2 border-border bg-[#fffaf0] p-3 shadow-[8px_9px_0_var(--foreground)] sm:p-5">
              <div className="flex items-center justify-between gap-4 border-b-2 border-dashed border-border/50 pb-3">
                <div className="space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-4 w-52 max-w-full" /></div>
                <Skeleton className="h-7 w-36 rounded-[999px]" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-28 rounded-[9px] sm:col-span-2 sm:mx-8" />
                {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-[9px]" />)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y-2 border-border bg-card px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeadingSkeleton />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => <WorkflowCardSkeleton key={index} />)}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeadingSkeleton />
          <div className="mt-10 overflow-hidden rounded-[10px] border-2 border-border bg-card shadow-[6px_7px_0_var(--foreground)]">
            <div className="flex items-center justify-between border-b-2 border-border px-5 py-4">
              <Skeleton className="h-11 w-64 max-w-full rounded-[8px]" />
              <Skeleton className="h-10 w-36 rounded-[7px]" />
            </div>
            <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
              <div className="border-b-2 border-border p-5 lg:border-b-0 lg:border-r-2">
                <div className="grid gap-3 sm:grid-cols-2"><Skeleton className="h-32 rounded-[9px]" /><Skeleton className="h-32 rounded-[9px]" /></div>
                <Skeleton className="mt-5 h-64 rounded-[9px]" />
              </div>
              <div className="grid gap-4 p-5"><Skeleton className="h-56 rounded-[9px]" /><Skeleton className="h-56 rounded-[9px]" /></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#e5f6ed] px-4 pt-16 sm:px-6 lg:px-8 lg:pt-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div className="space-y-4"><Skeleton className="h-5 w-52" /><Skeleton className="h-3 w-44" /><Skeleton className="h-28 w-full max-w-[32rem]" /></div>
            <div className="grid gap-3 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-56 rounded-[9px]" />)}</div>
          </div>
          <div className="mt-16 grid gap-8 rounded-[10px] border-2 border-border bg-[var(--paper-yellow)] px-5 py-10 shadow-[7px_8px_0_var(--foreground)] lg:grid-cols-[1fr_auto] lg:items-end lg:px-12">
            <Skeleton className="h-28 w-full max-w-[44rem]" />
            <Skeleton className="h-13 w-full rounded-[7px] lg:w-56" />
          </div>
          <footer className="mt-10 flex items-center justify-between border-t-2 border-border/70 py-6"><Skeleton className="h-9 w-32" /><Skeleton className="h-3 w-32" /></footer>
        </div>
      </section>
    </main>
  );
}
