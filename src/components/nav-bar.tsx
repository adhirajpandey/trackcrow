"use client";

import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavBarProps {
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
  showSidebarToggle?: boolean;
}

export function NavBar({ isMobileOpen, onMobileToggle, showSidebarToggle = false }: NavBarProps) {
  const session = useSession();

  return (
    <nav className="bg-black/90 backdrop-blur-sm text-white py-1.5 shadow-2xl border-b border-white/10 relative z-40">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          {showSidebarToggle && (
            <button
              className="lg:hidden p-2 bg-background/10 rounded-md hover:bg-background/20 transition-colors relative z-50"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Button clicked, calling onMobileToggle');
                onMobileToggle?.();
              }}
              aria-label="Toggle sidebar"
            >
              <ChevronRight className={cn("h-5 w-5 transition-transform", isMobileOpen && "rotate-180")} />
            </button>
          )}
          <a
            href="/"
            className={cn(
              "flex items-center hover:opacity-80 transition-opacity duration-200",
              showSidebarToggle && "lg:block hidden"
            )}
          >
            <Image
              src="/trackcrow.png"
              alt="Trackcrow Logo"
              width={100}
              height={100}
              className="cursor-pointer"
              priority
            />
          </a>
        </div>

        <div>
          {!session.data?.user && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-2 border-border hover:bg-muted px-6 py-2 rounded-xl font-medium transition-all duration-300 hover:border-primary/50"
                onClick={() =>
                  signIn("google", { callbackUrl: "/dashboard" })
                }
              >
                Sign In
              </Button>
              <Button
                variant="default"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => signIn("google", { callbackUrl: "/" })}
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
