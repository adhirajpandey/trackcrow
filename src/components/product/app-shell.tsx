"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ArrowRight,
  Bird,
  ClipboardList,
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
  { href: "/dashboard", label: "Overview", icon: Gauge },
  { href: "/imports/review", label: "Review queue", icon: ClipboardList },
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(104,211,145,0.10),transparent_28%),linear-gradient(180deg,#08100c_0%,#09110d_36%,#0f1411_100%)] text-foreground lg:grid lg:grid-cols-[244px_1fr]">
      <aside className="hidden border-r border-border/55 bg-[#08100d]/84 backdrop-blur-xl lg:block">
        <ShellSidebar pathname={pathname} user={user} />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-border/70 bg-background/95 px-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full border border-border/70 bg-background/30"
              onClick={() => setIsOpen(true)}
              aria-label="Open navigation"
              title="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                TrackCrow
              </p>
              <p className="text-base font-semibold text-foreground">Spend ops</p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            title="Sign out"
            className="rounded-full border border-border/70 bg-background/30"
            onClick={() => void signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        {isOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-background/80"
              aria-label="Close navigation"
              onClick={() => setIsOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-72 border-r border-border/70 bg-[#09110d] p-5">
              <div className="mb-8 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  TrackCrow
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Close navigation"
                  title="Close navigation"
                  className="rounded-full border border-border/70 bg-background/25"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <ShellSidebarContent pathname={pathname} onNavigate={() => setIsOpen(false)} />
            </aside>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-[1560px] px-4 py-6 lg:px-7 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function ShellSidebar({
  pathname,
  user,
}: {
  pathname: string;
  user: AppShellUser;
}) {
  return (
    <div className="sticky top-0 flex h-screen flex-col px-4 py-5">
      <ShellSidebarContent pathname={pathname} />
      <div className="mt-auto rounded-[8px] border border-border/50 bg-[linear-gradient(180deg,rgba(12,24,18,0.94),rgba(10,18,14,0.94))] p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/18 bg-primary/10 text-sm font-semibold text-primary">
            {getInitials(user.name, user.email)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {user.name ?? "TrackCrow user"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email ?? "Signed in"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            title="Sign out"
            className="h-8 w-8 rounded-full border border-border/55 bg-background/28 text-secondary-foreground hover:bg-secondary/40"
            onClick={() => void signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ShellSidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="rounded-[8px] border border-border/50 bg-transparent px-4 py-4">
        <div className="flex items-center gap-3">
          <Bird className="h-4.5 w-4.5 text-primary" />
          <p className="text-[15px] font-semibold uppercase tracking-[0.05em] text-primary">
            TrackCrow
          </p>
        </div>
        <p className="mt-5 text-[26px] font-semibold leading-none text-foreground">
          Spend ops
        </p>
        <p className="mt-3 max-w-[14rem] text-sm leading-6 text-secondary-foreground">
          Track spending. Stay in control.
        </p>
      </div>

      <ShellNav pathname={pathname} onNavigate={onNavigate} />

      <div className="mt-7 rounded-[8px] border border-border/50 bg-[linear-gradient(180deg,rgba(12,24,18,0.94),rgba(10,18,14,0.94))] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Track smarter</p>
            <p className="mt-3 text-sm leading-6 text-secondary-foreground">
              Create rules to auto-categorize repeated payees and save time on reviews.
            </p>
          </div>
          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        </div>
        <Link
          href="/categories"
          onClick={onNavigate}
          className="mt-4 inline-flex min-h-9 w-full items-center justify-between rounded-[8px] border border-border/55 bg-background/24 px-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Create a rule
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
    </>
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
    <nav className="mt-6 space-y-1.5">
      {navigation.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-10 items-center gap-3 rounded-[8px] border border-border/35 px-3.5 text-sm font-semibold text-secondary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-primary/24 bg-[linear-gradient(90deg,rgba(104,211,145,0.14),rgba(104,211,145,0.04))] text-foreground"
                : "hover:border-border/45 hover:bg-secondary/24 hover:text-foreground"
            )}
          >
            <Icon className={cn("h-[15px] w-[15px]", active && "text-primary")} />
            <span className="flex-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function getInitials(name: string | null, email: string | null) {
  const source = name?.trim() || email?.trim() || "TC";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}
