import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <section className="w-full max-w-md space-y-5 border border-border bg-card p-8">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-10 rounded-[10px]" />
        <Skeleton className="h-4 w-24 rounded-[8px]" />
      </div>
      <Skeleton className="h-10 w-3/4" />
      <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /></div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </section>
  );
}
