import { requirePageSessionUser } from "@/server/auth/session";

import { AppLayoutShell } from "./app-layout-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requirePageSessionUser();

  return <AppLayoutShell user={user}>{children}</AppLayoutShell>;
}
