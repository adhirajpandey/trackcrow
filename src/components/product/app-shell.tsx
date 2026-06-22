"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
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

const signOutCallbackUrl = "/login";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: Gauge },
  { href: "/imports/review", label: "Review queue", icon: ClipboardList },
  { href: "/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/categories", label: "Categories", icon: FolderTree },
  { href: "/recipients", label: "Recipients", icon: Users },
];

function handleSignOut() {
  return signOut({ callbackUrl: signOutCallbackUrl });
}

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(104,211,145,0.10),transparent_28%),linear-gradient(180deg,#08100c_0%,#09110d_36%,#0f1411_100%)] text-foreground lg:grid lg:grid-cols-[276px_1fr]">
      <aside className="hidden border-r border-border/55 bg-[#06100c]/88 backdrop-blur-xl lg:block">
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
            onClick={() => void handleSignOut()}
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
            <aside className="absolute left-0 top-0 h-full w-[276px] border-r border-border/70 bg-[#06100c]/96 px-4 py-5 backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-end">
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
              <ShellSidebarContent
                pathname={pathname}
                user={user}
                onNavigate={() => setIsOpen(false)}
              />
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
    <div className="sticky top-0 h-screen px-4 py-5">
      <div className="flex h-full flex-col">
        <ShellSidebarContent pathname={pathname} user={user} />
      </div>
    </div>
  );
}

function ShellSidebarContent({
  pathname,
  user,
  onNavigate,
}: {
  pathname: string;
  user: AppShellUser;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="relative overflow-hidden rounded-[16px] border border-primary/18 bg-[linear-gradient(180deg,rgba(8,24,18,0.96),rgba(6,15,12,0.9))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(104,211,145,0.16),transparent_32%),linear-gradient(135deg,rgba(104,211,145,0.07),transparent_55%)]" />
        <div className="pointer-events-none absolute bottom-2 right-0 h-14 w-28 bg-[linear-gradient(180deg,transparent,rgba(104,211,145,0.14))] opacity-70 [mask-image:repeating-linear-gradient(180deg,transparent,transparent_3px,black_4px)]" />
        <span className="pointer-events-none absolute right-4 top-4 h-1.5 w-1.5 rotate-45 bg-primary/70" />
        <p className="relative text-[13px] font-semibold uppercase tracking-[0.24em] text-primary">
          TrackCrow
        </p>
        <p className="relative mt-5 max-w-[11rem] text-[16px] font-semibold leading-[1.4] text-foreground">
          Track. Review. Control.
        </p>
      </div>

      <ShellNav pathname={pathname} onNavigate={onNavigate} />

      <ProfileCard user={user} onNavigate={onNavigate} />
    </>
  );
}

function ProfileCard({
  user,
  onNavigate,
}: {
  user: AppShellUser;
  onNavigate?: () => void;
}) {
  return (
    <div className="mt-auto rounded-[20px] border border-[#244030] bg-[linear-gradient(180deg,rgba(10,20,16,0.96),rgba(9,17,14,0.98))] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex items-center gap-3">
        <UserAvatar user={user} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold leading-tight text-[#eef5f0]">
            {user.name ?? "TrackCrow user"}
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6fcf97]">
            Free account
          </p>
          <p
            className="mt-1.5 truncate text-[12px] leading-[1.3] text-[#a4b7ac]"
            title={user.email ?? "Signed in"}
          >
            {user.email ?? "Signed in"}
          </p>
        </div>
      </div>
      <div className="mt-3.5 h-px bg-[linear-gradient(90deg,rgba(111,207,151,0.18),rgba(255,255,255,0.04),transparent)]" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          href="/settings"
          onClick={onNavigate}
          className="inline-flex min-h-9 items-center justify-center gap-2 whitespace-nowrap rounded-[12px] border border-[#2b4436] bg-[#0d1713]/52 px-3 text-sm font-medium text-[#d5e2da] transition-colors hover:border-primary/25 hover:bg-primary/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Settings className="h-3.5 w-3.5 text-primary" />
          Settings
        </Link>
        <Button
          type="button"
          variant="ghost"
          aria-label="Sign out"
          title="Sign out"
          className="min-h-9 cursor-pointer whitespace-nowrap rounded-[12px] border border-[#563333] bg-[#211111]/52 px-3 text-sm font-medium text-[#f49c9c] hover:border-[#cf4a4a]/55 hover:bg-[#361616] hover:text-[#ffd0d0] focus-visible:ring-[#cf4a4a]"
          onClick={() => void handleSignOut()}
        >
          <LogOut className="h-3.5 w-3.5 text-[#ff9b9b]" />
          Logout
        </Button>
      </div>
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
    <nav className="mt-5 space-y-1">
      {navigation.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex min-h-11 items-center gap-3 rounded-[14px] px-3.5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-[linear-gradient(180deg,rgba(104,211,145,0.18),rgba(104,211,145,0.08))] text-foreground"
                : "text-muted-foreground hover:bg-white/2 hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                active
                  ? "border-primary/20 bg-[#11271d] text-primary"
                  : "border-white/8 bg-transparent text-muted-foreground group-hover:border-primary/12 group-hover:bg-primary/6 group-hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="flex-1">{item.label}</span>
            <span
              aria-hidden="true"
              className={cn(
                "h-6 w-1 rounded-full transition-opacity",
                active ? "bg-primary shadow-[0_0_12px_rgba(104,211,145,0.8)]" : "opacity-0"
              )}
            />
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

function UserAvatar({ user }: { user: AppShellUser }) {
  const initials = getInitials(user.name, user.email);

  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#355541] bg-[linear-gradient(180deg,#214e35,#183726)] shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      {user.image ? (
        <Image
          src={user.image}
          alt={user.name ? `${user.name} profile photo` : "Profile photo"}
          fill
          sizes="40px"
          className="rounded-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full text-[16px] font-semibold tracking-[-0.05em] text-[#eff8f1]">
          {initials}
        </div>
      )}
      <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-[#0b1511] bg-[#67ef98]" />
    </div>
  );
}
