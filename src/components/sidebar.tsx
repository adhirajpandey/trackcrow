"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Home,
  Wallet,
  Bot,
  Settings,
  User,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
// Removed dropdown menu for avatar actions
import Image from "next/image";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Transactions", href: "/transactions", icon: Wallet },
  { name: "Crow Bot", href: "/crow-bot", icon: Bot },
  { name: "Preferences", href: "/preferences", icon: Settings },
  { name: "Profile", href: "/user", icon: User },
];

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Debug logging
  console.log(
    "Sidebar render - isMobileOpen:",
    isMobileOpen,
    "isCollapsed:",
    isCollapsed,
  );

  const NavItem = ({ item }: { item: (typeof navigation)[0] }) => (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Link
          href={item.href}
          className={cn(
            "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === item.href
              ? "bg-secondary text-secondary-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
            isCollapsed && !isMobileOpen && "justify-center px-2",
          )}
          onClick={() => {
            if (isMobileOpen) onMobileClose();
          }}
        >
          <item.icon
            className={cn("h-4 w-4", (!isCollapsed || isMobileOpen) && "mr-3")}
          />
          {(!isCollapsed || isMobileOpen) && <span>{item.name}</span>}
        </Link>
      </TooltipTrigger>
      {isCollapsed && !isMobileOpen && (
        <TooltipContent side="right" className="flex items-center gap-4">
          {item.name}
        </TooltipContent>
      )}
    </Tooltip>
  );

  return (
    <TooltipProvider>
      <>
        {/* Mobile overlay */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={onMobileClose}
          />
        )}
        <div
          className={cn(
            "fixed inset-y-0 z-40 flex flex-col bg-background border-r border-border transition-all duration-300 ease-in-out lg:static lg:z-auto",
            isMobileOpen ? "w-64" : isCollapsed ? "w-[72px]" : "w-64",
            isMobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0",
          )}
        >
          <div className="border-b border-border">
            <div
              className={cn(
                "flex h-16 items-center gap-2 px-4",
                isCollapsed && !isMobileOpen && "justify-center px-2",
              )}
            >
              {(!isCollapsed || isMobileOpen) && (
                <Link href="/" className="flex items-center font-semibold">
                  <span className="text-lg">TrackCrow</span>
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "ml-auto h-8 w-8",
                  isCollapsed && !isMobileOpen && "ml-0",
                )}
                onClick={(e) => {
                  // Prevent any outer click handlers from running
                  e.stopPropagation();
                  if (isMobileOpen) {
                    // On mobile, the chevron should close the mobile sidebar
                    onMobileClose();
                    return;
                  }
                  setIsCollapsed(!isCollapsed);
                }}
              >
                <ChevronLeft
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isCollapsed && !isMobileOpen && "rotate-180",
                  )}
                />
                <span className="sr-only">
                  {isCollapsed && !isMobileOpen ? "Expand" : "Collapse"} Sidebar
                </span>
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </nav>
          </div>
          <div className="border-t border-border p-2 pt-4">
            {session?.user && (
              <div
                className={cn(
                  "flex items-center",
                  isCollapsed && !isMobileOpen ? "justify-center" : "gap-2",
                )}
              >
                {(!isCollapsed || isMobileOpen) && (
                  <>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <Image
                        src={session.user.image || "/trackcrow.png"}
                        alt={session.user.name || "Profile"}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full"
                        priority
                      />
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium truncate">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {session.user.email}
                      </p>
                    </div>
                  </>
                )}
                {isCollapsed && !isMobileOpen && (
                  <Avatar className="h-8 w-8">
                    <Image
                      src={session.user.image || "/trackcrow.png"}
                      alt={session.user.name || "Profile"}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full"
                      priority
                    />
                  </Avatar>
                )}
              </div>
            )}
            {session?.user && (!isCollapsed || isMobileOpen) && (
              <div className="mt-3">
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    signOut({ callbackUrl: "/" });
                  }}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    "text-red-500 hover:bg-secondary hover:text-red-500",
                  )}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  <span>Logout</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </>
    </TooltipProvider>
  );
}
