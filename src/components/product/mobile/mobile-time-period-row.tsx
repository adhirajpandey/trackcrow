"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

import type { DashboardRangeValue } from "@/features/dashboard/query-state";
import { cn } from "@/lib/utils";

export type MobileTimePeriodOption = {
  value: DashboardRangeValue;
  label: string;
};

export type MobileTimePeriodRowProps = {
  value: DashboardRangeValue;
  quickRanges: MobileTimePeriodOption[];
  secondaryRanges: MobileTimePeriodOption[];
  onSelect: (range: DashboardRangeValue) => void;
  renderMenuInPortal?: boolean;
  menuPortalZIndex?: number;
};

export const mobileDashboardSecondaryRanges = [
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "last-3-months", label: "Last 3 months" },
  { value: "last-6-months", label: "Last 6 months" },
  { value: "all-time", label: "All time" },
] satisfies MobileTimePeriodOption[];

export function MobileTimePeriodRow({
  value,
  quickRanges,
  secondaryRanges,
  onSelect,
  renderMenuInPortal = true,
  menuPortalZIndex = 80,
}: MobileTimePeriodRowProps) {
  const moreRangeActive = secondaryRanges.some((range) => range.value === value);

  return (
    <div className="grid grid-cols-5 gap-2">
      {quickRanges.map((range) => {
        const active = value === range.value;

        return (
          <button
            key={range.value}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(range.value)}
            className={cn(
              "min-h-11 rounded-[8px] border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-primary/70 bg-primary text-primary-foreground shadow-[0_0_0_1px_rgba(104,211,145,0.18)]"
                : "border-border/55 bg-background/10 text-secondary-foreground hover:bg-background/16 hover:text-foreground"
            )}
          >
            {range.label}
          </button>
        );
      })}
      <MoreTimePeriodsMenu
        value={value}
        options={secondaryRanges}
        onSelect={onSelect}
        triggerActive={moreRangeActive}
        renderInPortal={renderMenuInPortal}
        portalZIndex={menuPortalZIndex}
      />
    </div>
  );
}

function MoreTimePeriodsMenu({
  value,
  options,
  onSelect,
  triggerActive,
  renderInPortal,
  portalZIndex,
}: {
  value: DashboardRangeValue;
  options: MobileTimePeriodOption[];
  onSelect: (range: DashboardRangeValue) => void;
  triggerActive: boolean;
  renderInPortal: boolean;
  portalZIndex: number;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | undefined>(undefined);

  useEffect(() => {
    if (!isOpen || !renderInPortal) {
      return;
    }

    function updateMenuPosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const minWidth = 216;
      const left = Math.max(12, Math.min(rect.right - minWidth, window.innerWidth - minWidth - 12));

      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left,
        width: minWidth,
        minWidth,
        zIndex: portalZIndex,
      });
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen, portalZIndex, renderInPortal]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      const clickedInsideTrigger = menuRef.current?.contains(target);
      const clickedInsideMenu = menuPanelRef.current?.contains(target);

      if (!clickedInsideTrigger && !clickedInsideMenu) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      window.addEventListener("mousedown", handlePointerDown);
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const menuContent = (
    <div
      ref={menuPanelRef}
      role="listbox"
      style={renderInPortal ? menuStyle : undefined}
      className={cn(
        "overflow-hidden rounded-[8px] border border-border/70 bg-[linear-gradient(180deg,rgba(17,27,22,0.98),rgba(10,16,13,0.99))] shadow-[0_18px_38px_rgba(0,0,0,0.32)]",
        renderInPortal ? "" : "absolute right-0 top-[calc(100%+0.5rem)] z-20 w-[13.5rem] min-w-[13.5rem]"
      )}
    >
      <div className="border-b border-border/45 px-3 py-2 text-xs font-semibold text-secondary-foreground">
        More time periods
      </div>
      <div className="max-h-56 overflow-y-auto py-1">
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => {
                setIsOpen(false);
                onSelect(option.value);
              }}
              className={cn(
                "flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:bg-secondary/20",
                selected
                  ? "bg-primary/12 text-primary hover:bg-primary/16"
                  : "text-foreground hover:bg-secondary/20"
              )}
            >
              <span className="truncate">{option.label}</span>
              {selected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div ref={menuRef} className="relative min-w-0">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className={cn(
          "inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-[8px] border border-border/50 bg-background/16 px-3 text-sm font-semibold text-foreground transition-colors hover:bg-background/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          (isOpen || triggerActive) && "border-primary/70 bg-primary/14 text-primary"
        )}
      >
        <span className="truncate text-center">More</span>
        <ChevronDown className="hidden h-4 w-4 shrink-0 transition-transform" aria-hidden="true" />
      </button>

      {isOpen
        ? renderInPortal
          ? createPortal(menuContent, document.body)
          : menuContent
        : null}
    </div>
  );
}
