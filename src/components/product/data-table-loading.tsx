import { LoaderCircle } from "lucide-react";

export function DataTableLoading({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-5 py-8 text-center">
      <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
      <p className="text-sm text-secondary-foreground">{label}</p>
    </div>
  );
}
