import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function MarketingNotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="max-w-lg border border-border bg-card p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          404
        </p>
        <h1 className="mt-4 text-3xl font-bold">Page not found.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The public page you requested does not exist.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Go home</Link>
        </Button>
      </section>
    </main>
  );
}
