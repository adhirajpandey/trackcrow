"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  type LandingNavigationState,
  shouldRedirectLanding,
  updateLandingNavigation,
} from "./landing-navigation-state";

const LandingNavigationContext = createContext<LandingNavigationState>({
  pathname: "/",
  internalLanding: false,
});

export function LandingNavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [navigation, setNavigation] = useState<LandingNavigationState>({
    pathname,
    internalLanding: false,
  });

  // Adjust before rendering children so the gate never sees the previous route.
  const current = updateLandingNavigation(navigation, pathname);
  if (current !== navigation) setNavigation(current);

  return (
    <LandingNavigationContext.Provider value={current}>
      {children}
    </LandingNavigationContext.Provider>
  );
}

export function LandingNavigationGate({
  authenticated,
  children,
}: {
  authenticated: boolean;
  children: React.ReactNode;
}) {
  const navigation = useContext(LandingNavigationContext);
  const router = useRouter();
  const redirect = shouldRedirectLanding(authenticated, navigation);

  useEffect(() => {
    if (redirect) router.replace("/dashboard");
  }, [redirect, router]);

  if (redirect) {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-foreground">
        <p role="status">Opening dashboard…</p>
      </main>
    );
  }

  return children;
}
