"use client";

import { Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function DashboardCardInfo({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = `dashboard-card-info-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const rootRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <span ref={rootRef} className="relative inline-flex shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`About ${label.toLowerCase()}`}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-secondary-foreground/80 transition-[color,transform] hover:-translate-y-px hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        onClick={() => setIsOpen((open) => !open)}
      >
        <Info aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>

      {isOpen ? (
        <span
          id={panelId}
          role="region"
          aria-label={`${label} details`}
          className="absolute left-1/2 top-full z-30 mt-2 w-[min(17rem,calc(100vw-3rem))] -translate-x-1/2 rounded-[8px] border-2 border-border bg-card px-3 py-2.5 text-left text-xs font-medium normal-case leading-5 tracking-normal text-secondary-foreground shadow-[3px_4px_0_var(--foreground)]"
        >
          {description}
        </span>
      ) : null}
    </span>
  );
}
