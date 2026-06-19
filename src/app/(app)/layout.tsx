import { AppShell } from "@/components/product/app-shell";
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
    </QueryProvider>
  );
}
