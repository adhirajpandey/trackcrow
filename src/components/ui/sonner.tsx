"use client";

import { CheckCircle2, CircleAlert, Info } from "lucide-react";
import { Toaster as Sonner, toast as sonnerToast } from "sonner";

type AppToastTone = "success" | "error" | "info" | "warning";

type AppToastInput = {
  title?: string;
  description: string;
  tone?: AppToastTone;
  durationMs?: number;
  actionLabel?: string;
  onAction?: () => void;
};

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      richColors={false}
      closeButton
      expand={false}
      theme="dark"
      toastOptions={{
        classNames: {
          toast:
            "trackcrow-sonner rounded-[8px] border border-border/60 bg-[linear-gradient(180deg,rgba(17,27,22,0.98),rgba(10,16,13,0.99))] text-foreground shadow-[0_18px_38px_rgba(0,0,0,0.32)]",
          title: "text-sm font-semibold text-foreground",
          description: "text-sm leading-5 text-secondary-foreground",
          closeButton:
            "border-border/35 bg-background/10 text-secondary-foreground hover:bg-background/16 hover:text-foreground",
          actionButton:
            "min-h-8 rounded-[8px] border border-border/45 bg-background/12 px-3 text-sm font-semibold text-foreground hover:bg-background/18",
          cancelButton:
            "min-h-8 rounded-[8px] border border-border/45 bg-background/12 px-3 text-sm font-semibold text-foreground hover:bg-background/18",
        },
      }}
    />
  );
}

export function toast(input: AppToastInput) {
  const tone = input.tone ?? "info";
  const title = input.title ?? "";

  const options = {
    description: input.description,
    duration: input.durationMs ?? 3200,
    icon: getToastIcon(tone),
    action:
      input.actionLabel && input.onAction
        ? {
            label: input.actionLabel,
            onClick: input.onAction,
          }
        : undefined,
    className: getToastToneClassName(tone),
  };

  if (tone === "success") {
    return sonnerToast.success(title || input.description, options);
  }

  if (tone === "error") {
    return sonnerToast.error(title || input.description, options);
  }

  if (tone === "warning") {
    return sonnerToast.warning(title || input.description, options);
  }

  return sonnerToast.info(title || input.description, options);
}

function getToastIcon(tone: AppToastTone) {
  if (tone === "success") {
    return <CheckCircle2 className="h-5 w-5 text-primary" />;
  }

  if (tone === "error") {
    return <CircleAlert className="h-5 w-5 text-destructive" />;
  }

  if (tone === "warning") {
    return <CircleAlert className="h-5 w-5 text-accent" />;
  }

  return <Info className="h-5 w-5 text-info" />;
}

function getToastToneClassName(tone: AppToastTone) {
  if (tone === "success") {
    return "border-primary/35 bg-[linear-gradient(180deg,rgba(18,36,25,0.98),rgba(11,21,15,0.99))]";
  }

  if (tone === "error") {
    return "border-destructive/45 bg-[linear-gradient(180deg,rgba(46,18,18,0.98),rgba(28,10,10,0.99))]";
  }

  if (tone === "warning") {
    return "border-accent/38 bg-[linear-gradient(180deg,rgba(42,33,12,0.98),rgba(24,18,8,0.99))]";
  }

  return "border-info/35 bg-[linear-gradient(180deg,rgba(19,28,38,0.98),rgba(11,17,24,0.99))]";
}
