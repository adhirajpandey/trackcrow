"use client";

import { Button } from "@/components/ui/button";

export default function AuthError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="w-full max-w-md border border-border bg-card p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        Authentication
      </p>
      <h1 className="mt-4 text-3xl font-bold">Sign-in failed.</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Retry the sign-in screen. If this repeats, check the auth provider
        configuration.
      </p>
      <Button onClick={reset} className="mt-6">
        Retry
      </Button>
    </section>
  );
}
