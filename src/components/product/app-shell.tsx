"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ClipboardList,
  Gauge,
  LogOut,
  ReceiptText,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";
import { useState } from "react";

import { BrandMark } from "@/components/product/brand-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppShellUser = {
  name: string | null;
  email: string | null;
  image: string | null;
};

const signOutCallbackUrl = "/";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: Gauge },
  { href: "/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/recipients", label: "Recipients", icon: Users },
  {
    href: "#review-queue",
    label: "Review queue",
    icon: ClipboardList,
    disabled: true,
  },
  { href: "/rules", label: "Rules", icon: ScrollText },
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
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-background text-foreground lg:grid lg:grid-cols-[276px_1fr]">
      <aside className="hidden border-r-2 border-border bg-[#fffaf0]/95 lg:block">
        <ShellSidebar pathname={pathname} searchParams={searchParams} user={user} />
      </aside>

      <div className="min-w-0 max-w-full overflow-x-hidden">
        <header className="sticky top-0 z-20 flex min-h-16 items-center border-b-2 border-border bg-[#fffaf0]/95 px-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] backdrop-blur lg:hidden">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              className="-ml-1 rounded-md px-1 py-1 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={() => setIsOpen(true)}
              aria-label="Open navigation"
              title="Open navigation"
            >
              <BrandMark
                className="gap-4"
                size="compact"
                markClassName="h-11 w-11 rounded-[12px]"
                textClassName="pt-px text-base tracking-normal text-foreground"
              />
            </button>
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
            <aside className="absolute left-0 top-0 flex h-full w-[86vw] max-w-[360px] flex-col border-r-2 border-border bg-[#fffaf0] px-[max(16px,env(safe-area-inset-left))] pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 pr-[max(16px,env(safe-area-inset-right))]">
              <div className="min-h-0 flex-1">
                <ShellSidebarContent
                  pathname={pathname}
                  searchParams={searchParams}
                  user={user}
                  onNavigate={() => setIsOpen(false)}
                />
              </div>
            </aside>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-[1560px] min-w-0 overflow-x-hidden px-4 py-6 lg:px-7 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}

function ShellSidebar({
  pathname,
  searchParams,
  user,
}: {
  pathname: string;
  searchParams: ReturnType<typeof useSearchParams>;
  user: AppShellUser;
}) {
  return (
    <div className="sticky top-0 h-screen px-4 py-5">
      <div className="h-full">
        <ShellSidebarContent pathname={pathname} searchParams={searchParams} user={user} />
      </div>
    </div>
  );
}

function ShellSidebarContent({
  pathname,
  searchParams,
  user,
  onNavigate,
}: {
  pathname: string;
  searchParams: ReturnType<typeof useSearchParams>;
  user: AppShellUser;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <SidebarBrand />

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
        <ShellNav pathname={pathname} searchParams={searchParams} onNavigate={onNavigate} />
      </div>

      <SidebarFooter user={user} />
    </div>
  );
}

function SidebarBrand() {
  return (
    <div className="border-b border-border/35 px-1 pb-5 pt-0.5">
      <div className="flex items-center gap-3">
        <BrandMark
          size="compact"
          showText={false}
          markClassName="h-11 w-11 rounded-[12px] border shadow-none"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-black uppercase leading-none tracking-[0.08em] text-foreground">
            TrackCrow
          </p>
          <p className="mt-1.5 truncate text-[0.78rem] font-semibold leading-tight text-secondary-foreground">
            Spending, made clear.
          </p>
        </div>
      </div>
    </div>
  );
}

function SidebarFooter({ user }: { user: AppShellUser }) {
  return (
    <div className="mt-4 border-t border-border/45 pb-[env(safe-area-inset-bottom)] pt-4">
      <ProfileCard user={user} />
    </div>
  );
}

function ProfileCard({ user }: { user: AppShellUser }) {
  return (
    <div className="rounded-[10px] border-2 border-border bg-card p-3.5 shadow-[3px_4px_0_var(--foreground)]">
      <div className="flex items-center gap-3">
        <UserAvatar user={user} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold leading-tight text-foreground">
            {user.name ?? "TrackCrow user"}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#238658]">Free account</p>
        </div>
      </div>
      <div className="mt-3.5 h-px bg-border/25" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div
          aria-disabled="true"
          className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 whitespace-nowrap rounded-md border-2 border-border/25 bg-transparent px-3 text-sm font-bold text-secondary-foreground/55"
        >
          <Settings className="h-3.5 w-3.5 text-secondary-foreground/45" />
          Settings
        </div>
        <Button
          type="button"
          variant="ghost"
          aria-label="Sign out"
          title="Sign out"
          className="min-h-11 cursor-pointer whitespace-nowrap rounded-md border-2 border-destructive bg-[#fff0ee] px-3 text-sm font-bold text-destructive hover:bg-[#ffdeda] focus-visible:ring-destructive"
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
  searchParams,
  onNavigate,
}: {
  pathname: string;
  searchParams: ReturnType<typeof useSearchParams>;
  onNavigate?: () => void;
}) {
  const review = searchParams.get("review");

  return (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const Icon = item.icon;
        const active =
          !item.disabled && isNavigationItemActive(item.href, pathname, review);
        const itemClassName = cn(
          "group relative flex min-h-11 items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-bold transition-[background-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active
            ? "border-2 border-border bg-primary text-foreground shadow-[2px_3px_0_var(--foreground)]"
            : item.disabled
              ? "cursor-not-allowed text-secondary-foreground/55"
              : "text-secondary-foreground hover:bg-secondary hover:text-foreground"
        );
        const iconClassName = cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
          active
            ? "border-border bg-[#e3f5ea] text-foreground"
            : item.disabled
              ? "border-border/25 bg-transparent text-secondary-foreground/45"
              : "border-border/45 bg-card text-secondary-foreground group-hover:border-border group-hover:bg-[var(--paper-mint)] group-hover:text-foreground"
        );

        const content = (
          <>
            <span className={iconClassName}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="flex-1">{item.label}</span>
            <span
              aria-hidden="true"
              className={cn(
                "h-6 w-1 rounded-full transition-opacity",
                active ? "bg-foreground" : "opacity-0"
              )}
            />
          </>
        );

        if (item.disabled) {
          return (
            <div key={item.label} aria-disabled="true" className={itemClassName}>
              {content}
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={itemClassName}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}

function isNavigationItemActive(
  href: string,
  pathname: string,
  review: string | null
) {
  if (href === "/transactions") {
    return (
      (pathname === href || pathname.startsWith(`${href}/`)) &&
      !(pathname === "/transactions" && review === "queue")
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
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
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-border bg-[var(--paper-mint)]">
      {user.image ? (
        <Image
          src={user.image}
          alt={user.name ? `${user.name} profile photo` : "Profile photo"}
          fill
          sizes="40px"
          className="rounded-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full text-[16px] font-bold tracking-[-0.05em] text-foreground">
          {initials}
        </div>
      )}
      <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-card bg-primary" />
    </div>
  );
}
