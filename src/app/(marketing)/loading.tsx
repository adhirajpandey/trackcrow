import { Skeleton } from "@/components/ui/skeleton";

export default function MarketingLoading() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="w-full max-w-3xl space-y-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="h-10 w-40" />
      </section>
    </main>
  );
}
