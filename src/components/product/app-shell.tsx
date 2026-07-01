"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ClipboardList,
  Gauge,
  LogOut,
  Menu,
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
    href: "/transactions?review=queue&status=uncategorized",
    id: "review-queue",
    label: "Review queue",
    icon: ClipboardList,
  },
  { href: "#rules", label: "Rules", icon: ScrollText, disabled: true },
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
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-[radial-gradient(circle_at_top,rgba(104,211,145,0.10),transparent_28%),linear-gradient(180deg,#08100c_0%,#09110d_36%,#0f1411_100%)] text-foreground lg:grid lg:grid-cols-[276px_1fr]">
      <aside className="hidden border-r border-border/55 bg-[#06100c]/88 backdrop-blur-xl lg:block">
        <ShellSidebar pathname={pathname} searchParams={searchParams} user={user} />
      </aside>

      <div className="min-w-0 max-w-full overflow-x-hidden">
        <header className="sticky top-0 z-20 flex min-h-16 items-center border-b border-border/70 bg-background/95 px-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] backdrop-blur lg:hidden">
          <div className="flex items-center gap-3.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-[12px] border border-transparent bg-transparent text-secondary-foreground/88 hover:bg-white/4 hover:text-foreground"
              onClick={() => setIsOpen(true)}
              aria-label="Open navigation"
              title="Open navigation"
            >
              <Menu className="h-[18px] w-[18px]" />
            </Button>
            <BrandMark
              className="gap-4"
              size="compact"
              markClassName="h-11 w-11 rounded-[12px]"
              textClassName="pt-px text-base tracking-normal text-foreground"
            />
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
            <aside className="absolute left-0 top-0 flex h-full w-[86vw] max-w-[360px] flex-col border-r border-border/70 bg-[#06100c]/96 px-[max(16px,env(safe-area-inset-left))] pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 pr-[max(16px,env(safe-area-inset-right))] backdrop-blur-xl">
              <div className="min-h-0 flex-1">
                <ShellSidebarContent
                  pathname={pathname}
                  searchParams={searchParams}
                  user={user}
                  onNavigate={() => setIsOpen(false)}
                  compactBrand
                />
              </div>
            </aside>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-[1560px] min-w-0 overflow-x-hidden px-4 py-6 lg:px-7 lg:py-6">
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
  compactBrand = false,
}: {
  pathname: string;
  searchParams: ReturnType<typeof useSearchParams>;
  user: AppShellUser;
  onNavigate?: () => void;
  compactBrand?: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <SidebarBrand compact={compactBrand} />

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        <ShellNav pathname={pathname} searchParams={searchParams} onNavigate={onNavigate} />
      </div>

      <SidebarFooter user={user} onNavigate={onNavigate} />
    </div>
  );
}

function SidebarBrand({ compact = false }: { compact?: boolean }) {
  const logoClassName = compact
    ? "h-[64px] w-[64px] rounded-[18px] border-[#9fe8be]/60 shadow-[0_0_0_1px_rgba(186,244,211,0.16),0_0_18px_rgba(104,211,145,0.24)]"
    : "h-[52px] w-[52px] rounded-[15px] border-[#9fe8be]/55 shadow-[0_0_0_1px_rgba(186,244,211,0.13),0_0_14px_rgba(104,211,145,0.16)]";
  const wordmarkClassName = compact
    ? "text-[1.02rem] tracking-[0.26em]"
    : "text-[0.84rem] tracking-[0.16em]";
  const subtitleClassName = compact
    ? "mt-1.5 text-[0.84rem] leading-[1.3]"
    : "mt-1 text-[0.74rem] leading-[1.2]";
  const taglineClassName = compact
    ? "mt-2 whitespace-nowrap text-[0.82rem] leading-5"
    : "mt-1.5 whitespace-nowrap text-[0.67rem] leading-4";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[20px] border border-[#72d8a2]/30 bg-[radial-gradient(circle_at_left,rgba(54,150,104,0.18),transparent_38%),linear-gradient(135deg,rgba(8,21,16,0.98),rgba(4,12,9,0.96))] px-4 py-3.5 shadow-[inset_0_0_0_1px_rgba(220,255,235,0.03),0_0_0_1px_rgba(114,216,162,0.05)]",
        !compact && "rounded-[18px] px-3.5 py-3"
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_26%,transparent_74%,rgba(114,216,162,0.05))]" />
      <div
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl",
          compact ? "-left-7 h-24 w-24" : "-left-5 h-18 w-18"
        )}
      />
      <div className={cn("relative flex items-center", compact ? "gap-3.5" : "gap-2.5")}>
        <BrandMark
          size="compact"
          showText={false}
          markClassName={logoClassName}
        />
        <div className="min-w-0 flex-1 self-center">
          <p
            className={cn(
              "font-semibold uppercase leading-none text-[#79d7a4]",
              compact ? "truncate" : "pr-1",
              wordmarkClassName
            )}
          >
            TrackCrow
          </p>
          <p className={cn("font-medium text-white/55", subtitleClassName)}>
            AI-powered expense tracking
          </p>
          <p className={cn("font-medium text-primary/82", taglineClassName)}>
            Track <span className={compact ? "px-1.5 text-primary/50" : "px-1 text-primary/45"}>|</span>{" "}
            Review <span className={compact ? "px-1.5 text-primary/50" : "px-1 text-primary/45"}>|</span>{" "}
            Control
          </p>
        </div>
      </div>
    </div>
  );
}

function SidebarFooter({
  user,
  onNavigate,
}: {
  user: AppShellUser;
  onNavigate?: () => void;
}) {
  return (
    <div className="mt-4 border-t border-border/45 pb-[env(safe-area-inset-bottom)] pt-4">
      <ProfileCard user={user} onNavigate={onNavigate} />
    </div>
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
    <div className="rounded-[20px] border border-[#244030] bg-[linear-gradient(180deg,rgba(10,20,16,0.96),rgba(9,17,14,0.98))] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex items-center gap-3">
        <UserAvatar user={user} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold leading-tight text-[#eef5f0]">
            {user.name ?? "TrackCrow user"}
          </p>
          <p className="mt-1 text-xs font-medium text-[#8ee5ad]">Free account</p>
        </div>
      </div>
      <div className="mt-3.5 h-px bg-[linear-gradient(90deg,rgba(111,207,151,0.18),rgba(255,255,255,0.04),transparent)]" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          href="/settings"
          onClick={onNavigate}
          className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[12px] border border-[#2b4436] bg-[#0d1713]/52 px-3 text-sm font-medium text-[#d5e2da] transition-colors hover:border-primary/25 hover:bg-primary/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Settings className="h-3.5 w-3.5 text-primary" />
          Settings
        </Link>
        <Button
          type="button"
          variant="ghost"
          aria-label="Sign out"
          title="Sign out"
          className="min-h-11 cursor-pointer whitespace-nowrap rounded-[12px] border border-[#563333] bg-[#211111]/52 px-3 text-sm font-medium text-[#f49c9c] hover:border-[#cf4a4a]/55 hover:bg-[#361616] hover:text-[#ffd0d0] focus-visible:ring-[#cf4a4a]"
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
    <nav className="mt-5 space-y-1">
      {navigation.map((item) => {
        const Icon = item.icon;
        const active =
          !item.disabled && isNavigationItemActive(item.href, pathname, review, item.id);
        const itemClassName = cn(
          "group relative flex min-h-11 items-center gap-3 rounded-[14px] px-3.5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active
            ? "bg-[linear-gradient(180deg,rgba(104,211,145,0.18),rgba(104,211,145,0.08))] text-foreground"
            : item.disabled
              ? "cursor-not-allowed text-secondary-foreground/55"
              : "text-secondary-foreground/90 hover:bg-white/2 hover:text-foreground"
        );
        const iconClassName = cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
          active
            ? "border-primary/20 bg-[#11271d] text-primary"
            : item.disabled
              ? "border-white/8 bg-transparent text-secondary-foreground/45"
              : "border-white/10 bg-transparent text-secondary-foreground/90 group-hover:border-primary/12 group-hover:bg-primary/6 group-hover:text-foreground"
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
                active ? "bg-primary shadow-[0_0_12px_rgba(104,211,145,0.8)]" : "opacity-0"
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
  review: string | null,
  itemId?: string
) {
  if (itemId === "review-queue") {
    return pathname === "/transactions" && review === "queue";
  }

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
