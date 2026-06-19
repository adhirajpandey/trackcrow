import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <section className="w-full max-w-md border border-border bg-card p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
        TrackCrow
      </p>
      <h1 className="mt-5 text-3xl font-bold leading-tight">Sign in to continue.</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Use the configured Google provider to access your spending dashboard.
      </p>
      <Button asChild className="mt-7 w-full">
        <Link href="/api/auth/signin/google">Continue with Google</Link>
      </Button>
      <Button asChild variant="ghost" className="mt-3 w-full">
        <Link href="/">Back to home</Link>
      </Button>
    </section>
  );
}
