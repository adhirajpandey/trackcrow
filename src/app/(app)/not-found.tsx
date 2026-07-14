import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <section className="mx-auto max-w-2xl rounded-[10px] border-2 border-border bg-card p-8 shadow-[4px_5px_0_var(--foreground)]">
      <p className="font-hand text-[17px] font-normal leading-tight text-destructive">
        404
      </p>
      <h1 className="mt-4 text-3xl font-bold">Resource not found.</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        The requested resource either does not exist or is not available to this
        account.
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    </section>
  );
}
