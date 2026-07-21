"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  triggerClassName?: string;
  contentClassName?: string;
  presentation?: "popover" | "inline";
};

const selectTriggerClassName =
  "inline-flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-[8px] border-2 border-input bg-card px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-secondary-foreground/85 focus-visible:ring-2 focus-visible:ring-ring";
const selectContentClassName =
  "z-20 w-full overflow-hidden rounded-[10px] border-2 border-border bg-card shadow-[3px_4px_0_var(--foreground)]";

export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  disabled = false,
  id,
  ariaLabel,
  triggerClassName,
  contentClassName,
  presentation = "popover",
}: SelectProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const optionRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [openUpward, setOpenUpward] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);
  const selectedOption = options.find((option) => option.value === value);
  const enabledOptions = options.filter((option) => !option.disabled);

  const findEnabledIndex = React.useCallback(
    (startIndex: number, direction: 1 | -1) => {
      if (options.length === 0) {
        return -1;
      }

      let index = startIndex;
      for (let attempts = 0; attempts < options.length; attempts += 1) {
        if (index < 0) {
          index = options.length - 1;
        } else if (index >= options.length) {
          index = 0;
        }

        if (!options[index]?.disabled) {
          return index;
        }

        index += direction;
      }

      return -1;
    },
    [options]
  );

  const getSelectedEnabledIndex = React.useCallback(() => {
    const selectedIndex = options.findIndex((option) => option.value === value && !option.disabled);
    if (selectedIndex >= 0) {
      return selectedIndex;
    }

    return findEnabledIndex(0, 1);
  }, [findEnabledIndex, options, value]);

  const closeMenu = React.useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
    triggerRef.current?.focus();
  }, []);

  const openMenu = React.useCallback(
    (preferredIndex?: number) => {
      if (disabled || enabledOptions.length === 0) {
        return;
      }

      const nextIndex =
        preferredIndex != null && preferredIndex >= 0
          ? preferredIndex
          : getSelectedEnabledIndex();

      setActiveIndex(nextIndex);
      setIsOpen(true);
    },
    [disabled, enabledOptions.length, getSelectedEnabledIndex]
  );

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target)) {
        closeMenu();
      }
    }

    function handleWindowKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleWindowKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleWindowKeyDown);
    };
  }, [closeMenu, isOpen]);

  React.useEffect(() => {
    if (!isOpen || presentation === "inline") {
      return;
    }

    const triggerRect = triggerRef.current?.getBoundingClientRect();
    if (!triggerRect) {
      return;
    }

    const optionCount = Math.min(options.length, 6);
    const estimatedHeight = Math.min(16 + optionCount * 40, 256);
    const spaceBelow = window.innerHeight - triggerRect.bottom - 12;
    const spaceAbove = triggerRect.top - 12;

    setOpenUpward(spaceBelow < estimatedHeight && spaceAbove > spaceBelow);
  }, [isOpen, options.length, presentation]);

  React.useEffect(() => {
    if (!isOpen || activeIndex < 0) {
      return;
    }

    optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, isOpen]);

  React.useEffect(() => {
    optionRefs.current = optionRefs.current.slice(0, options.length);
  }, [options.length]);

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled || enabledOptions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      openMenu(findEnabledIndex(0, 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(findEnabledIndex(options.length - 1, -1));
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    }
  }

  function handleOptionKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
    option: SelectOption
  ) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex(findEnabledIndex(index + 1, 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(findEnabledIndex(index - 1, -1));
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(findEnabledIndex(0, 1));
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(findEnabledIndex(options.length - 1, -1));
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!option.disabled) {
        onValueChange(option.value);
      }
      closeMenu();
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={id ? `${id}-menu` : undefined}
        disabled={disabled}
        onClick={() => {
          if (isOpen) {
            closeMenu();
          } else {
            openMenu();
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          selectTriggerClassName,
          isOpen && "bg-[var(--paper-mint)]",
          disabled && "cursor-not-allowed opacity-60",
          triggerClassName
        )}
      >
        <span className="truncate">
          {selectedOption?.label ?? placeholder ?? options[0]?.label ?? ""}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen ? (
        <div
          id={id ? `${id}-menu` : undefined}
          role="listbox"
          aria-label={ariaLabel}
          className={cn(
            selectContentClassName,
            presentation === "inline"
              ? "relative mt-2"
              : cn(
                  "absolute left-0",
                  openUpward
                    ? "bottom-[calc(100%+0.5rem)]"
                    : "top-[calc(100%+0.5rem)]"
                ),
            contentClassName
          )}
        >
          <div
            className={cn(
              "py-1",
              presentation === "popover" && "max-h-64 overflow-y-auto"
            )}
          >
            {options.map((option, index) => {
              const selected = option.value === value;

              return (
                <button
                  key={`${option.value}-${option.label}`}
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={option.disabled}
                  tabIndex={activeIndex === index ? 0 : -1}
                  onClick={() => {
                    if (option.disabled) {
                      return;
                    }

                    onValueChange(option.value);
                    closeMenu();
                  }}
                  onFocus={() => setActiveIndex(index)}
                  onKeyDown={(event) => handleOptionKeyDown(event, index, option)}
                  className={cn(
                    "flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:bg-secondary/60",
                    option.disabled && "cursor-not-allowed opacity-60 hover:bg-transparent"
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {selected ? <Check className="h-4 w-4 shrink-0 text-foreground" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
