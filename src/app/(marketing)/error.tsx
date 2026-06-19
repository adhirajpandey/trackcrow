"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function MarketingError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="max-w-lg border border-border bg-card p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          TrackCrow
        </p>
        <h1 className="mt-4 text-3xl font-bold">This page failed to load.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Retry the page or return to the public home screen.
        </p>
        <div className="mt-6 flex gap-3">
          <Button onClick={reset}>Retry</Button>
          <Button asChild variant="secondary">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
