import { AppShell } from "@/components/product/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/query/query-client";
import { requirePageSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requirePageSessionUser();

  return (
    <QueryProvider>
      <AppShell user={user}>{children}</AppShell>
      <Toaster />
    </QueryProvider>
  );
}
