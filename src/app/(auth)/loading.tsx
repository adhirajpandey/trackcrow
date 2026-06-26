import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <section className="w-full max-w-md space-y-5 border border-border bg-card p-8">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-10 w-full" />
    </section>
  );
}
