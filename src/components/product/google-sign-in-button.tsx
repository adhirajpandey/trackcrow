"use client";

import { useState, type ReactNode } from "react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";

type GoogleSignInButtonProps = {
  children?: ReactNode;
  className?: string;
  variant?: "default" | "secondary" | "ghost";
  size?: "default" | "sm" | "icon";
  callbackUrl?: string;
};

export function GoogleSignInButton({
  children = "Sign in",
  className,
  variant = "ghost",
  size = "default",
  callbackUrl = "/dashboard",
}: GoogleSignInButtonProps) {
  const [isPending, setIsPending] = useState(false);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={isPending}
      onClick={() => {
        setIsPending(true);
        void signIn("google", { callbackUrl });
      }}
    >
      {children}
    </Button>
  );
}
