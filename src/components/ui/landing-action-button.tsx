"use client";
import { Button } from "./button";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";

export function LandingActionButton() {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  if (isLoggedIn) {
    return (
      <Link href="/dashboard">
        <Button
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          Open Dashboard
        </Button>
      </Link>
    );
  }
  return (
    <Button
      size="lg"
      className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
      onClick={() => {
        signIn("google", { callbackUrl: "/dashboard" });
      }}
    >
      Get Started Free
    </Button>
  );
}
