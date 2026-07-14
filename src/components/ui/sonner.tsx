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
      position="bottom-right"
      richColors={false}
      closeButton
      expand={false}
      theme="light"
      toastOptions={{
        classNames: {
          toast:
            "trackcrow-sonner rounded-[8px] border-2 border-border bg-card text-foreground shadow-[4px_5px_0_var(--foreground)]",
          title: "text-sm font-semibold text-foreground",
          description: "text-sm leading-5 text-secondary-foreground",
          closeButton:
            "border-2 border-border bg-card text-secondary-foreground hover:bg-secondary/60 hover:text-foreground",
          actionButton:
            "min-h-8 rounded-[8px] border-2 border-border bg-card px-3 text-sm font-semibold text-foreground hover:bg-secondary/60",
          cancelButton:
            "min-h-8 rounded-[8px] border-2 border-border bg-card px-3 text-sm font-semibold text-foreground hover:bg-secondary/60",
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
    return <CheckCircle2 className="h-5 w-5 text-[#238658]" />;
  }

  if (tone === "error") {
    return <CircleAlert className="h-5 w-5 text-destructive" />;
  }

  if (tone === "warning") {
    return <CircleAlert className="h-5 w-5 text-foreground" />;
  }

  return <Info className="h-5 w-5 text-info" />;
}

function getToastToneClassName(tone: AppToastTone) {
  if (tone === "success") {
    return "border-border bg-[var(--paper-mint)]";
  }

  if (tone === "error") {
    return "border-destructive bg-[#fff0ee]";
  }

  if (tone === "warning") {
    return "border-border bg-[#fff1bd]";
  }

  return "border-border bg-[var(--paper-lilac)]";
}
