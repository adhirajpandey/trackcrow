"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  FolderTree,
  Gauge,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppShellUser = {
  name: string | null;
  email: string | null;
  image: string | null;
};

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/categories", label: "Categories", icon: FolderTree },
  { href: "/recipients", label: "Recipients", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  user,
  children,
}: {
  user: AppShellUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="hidden border-r border-border bg-muted/55 lg:block">
        <ShellSidebar pathname={pathname} />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                TrackCrow
              </p>
              <p className="text-sm text-muted-foreground">Product workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-48 truncate text-sm font-semibold">
                {user.name ?? "TrackCrow user"}
              </p>
              <p className="max-w-48 truncate text-xs text-muted-foreground">
                {user.email ?? "Signed in"}
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Sign out"
              onClick={() => void signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {isOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-background/80"
              aria-label="Close navigation"
              onClick={() => setIsOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-72 border-r border-border bg-muted p-5">
              <div className="mb-8 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  TrackCrow
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Close navigation"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <ShellNav pathname={pathname} onNavigate={() => setIsOpen(false)} />
            </aside>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function ShellSidebar({ pathname }: { pathname: string }) {
  return (
    <div className="sticky top-0 flex h-screen flex-col p-5">
      <div className="border-b border-border pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          TrackCrow
        </p>
        <p className="mt-3 text-xl font-semibold leading-none text-foreground/92">
          Spend ops
        </p>
      </div>
      <ShellNav pathname={pathname} />
    </div>
  );
}

function ShellNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="mt-6 space-y-1">
      {navigation.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-card/95 text-foreground"
                : "hover:bg-secondary/80 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
