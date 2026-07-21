"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ListSearchField({
  value,
  placeholder,
  ariaLabel,
  onCommit,
  className,
}: {
  value: string;
  placeholder: string;
  ariaLabel: string;
  onCommit: (value: string) => void;
  className?: string;
}) {
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <label
      className={cn(
        "flex min-h-12 w-full min-w-0 items-center gap-3 rounded-[8px] border-2 border-border bg-card px-3.5",
        className
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-secondary-foreground" />
      <span className="sr-only">{ariaLabel}</span>
      <input
        key={value}
        defaultValue={value}
        aria-label={ariaLabel}
        onChange={(event) => {
          const nextValue = event.target.value;
          if (timeoutRef.current !== null) {
            window.clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = window.setTimeout(() => onCommit(nextValue), 300);
        }}
        placeholder={placeholder}
        className="w-full min-w-0 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-secondary-foreground/85"
      />
    </label>
  );
}

export function FilterResetButton({
  disabled,
  onReset,
  className,
}: {
  disabled: boolean;
  onReset: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label="Reset filters"
      title="Reset filters"
      disabled={disabled}
      onClick={onReset}
      className={cn(
        "inline-flex h-12 w-12 items-center justify-center rounded-[8px] border-2 border-border bg-card text-secondary-foreground transition-colors hover:bg-secondary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45",
        className
      )}
    >
      <X className="h-4.5 w-4.5" aria-hidden="true" />
    </button>
  );
}

export function FilterSheetFooter({
  applyDisabled = false,
  onReset,
  onApply,
}: {
  applyDisabled?: boolean;
  onReset: () => void;
  onApply: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button type="button" variant="secondary" onClick={onReset}>
        Reset
      </Button>
      <Button type="button" disabled={applyDisabled} onClick={onApply}>
        Apply filters
      </Button>
    </div>
  );
}

export function FilterSection({
  number,
  title,
  children,
}: {
  number?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 border-b border-border/40 pb-5 last:border-b-0 last:pb-0">
      <div className="flex items-center gap-2">
        {number ? <span className="text-sm font-semibold text-foreground">{number}.</span> : null}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export function NumericRangeFields({
  legend,
  minValue,
  maxValue,
  step,
  integer = false,
  error,
  onMinChange,
  onMaxChange,
}: {
  legend: string;
  minValue: string;
  maxValue: string;
  step: string;
  integer?: boolean;
  error?: string | null;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}) {
  const inputClassName =
    "min-h-11 w-full rounded-[8px] border-2 border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <fieldset className="grid gap-3" aria-describedby={error ? `${legend}-error` : undefined}>
      <legend className="sr-only">{legend}</legend>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1.5 text-xs font-semibold text-secondary-foreground">
          Minimum
          <input
            type="number"
            inputMode={integer ? "numeric" : "decimal"}
            min="0"
            step={step}
            value={minValue}
            onChange={(event) => onMinChange(event.target.value)}
            placeholder="No minimum"
            className={inputClassName}
          />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold text-secondary-foreground">
          Maximum
          <input
            type="number"
            inputMode={integer ? "numeric" : "decimal"}
            min="0"
            step={step}
            value={maxValue}
            onChange={(event) => onMaxChange(event.target.value)}
            placeholder="No maximum"
            className={inputClassName}
          />
        </label>
      </div>
      {error ? (
        <p id={`${legend}-error`} role="alert" className="text-xs font-semibold text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
