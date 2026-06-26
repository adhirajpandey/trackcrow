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
    <section className="mx-auto max-w-2xl border border-border bg-card p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
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
