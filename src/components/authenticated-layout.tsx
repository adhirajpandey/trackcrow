"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { NavBar } from "./nav-bar";
import Link from "next/link";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Don't show sidebar on landing page or if user is not authenticated
  const isLandingPage = pathname === "/";

  if (isLandingPage) {
    // Landing page layout - no sidebar, but show navbar
    return (
      <div className="flex flex-col h-screen">
        <NavBar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    );
  }

  if (status === "loading") {
    // Show loading state while checking authentication
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    // Not authenticated - redirect to landing page or show auth prompt
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to access this page.
          </p>
          <Link
            href="/api/auth/signin/google"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Authenticated user - show sidebar layout with navbar on mobile
  return (
    <div className="flex h-screen">
      <Sidebar
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0 relative z-10">
        {/* Show navbar on mobile for authenticated users */}
        <div className="lg:hidden relative z-50">
          <NavBar
            isMobileOpen={isMobileOpen}
            onMobileToggle={() => {
              console.log(
                "Mobile toggle clicked, current state:",
                isMobileOpen,
              );
              setIsMobileOpen(!isMobileOpen);
            }}
            showSidebarToggle={true}
          />
        </div>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
