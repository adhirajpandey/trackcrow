"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto max-w-2xl rounded-[10px] border-2 border-border bg-card p-8 shadow-[4px_5px_0_var(--foreground)]">
      <p className="font-hand text-[17px] font-normal leading-tight text-destructive">
        Product error
      </p>
      <h1 className="mt-4 text-3xl font-bold">The workspace failed to load.</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Retry the request or return to the dashboard. Internal error details are
        intentionally hidden from the product UI.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={reset}>Retry</Button>
        <Button asChild variant="secondary">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </section>
  );
}
