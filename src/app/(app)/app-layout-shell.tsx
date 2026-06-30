"use client";

import { AppShell } from "@/components/product/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/query/query-client";

type AppLayoutShellUser = {
  name: string | null;
  email: string | null;
  image: string | null;
};

export function AppLayoutShell({
  user,
  children,
}: {
  user: AppLayoutShellUser;
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <AppShell user={user}>{children}</AppShell>
      <Toaster />
    </QueryProvider>
  );
}
