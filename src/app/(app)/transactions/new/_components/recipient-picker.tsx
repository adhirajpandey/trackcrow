"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import { LoaderCircle, Plus, Search, UserRound } from "lucide-react";

import { useRecipientPickerQuery } from "@/features/recipients/queries";
import type { RecipientListItemDto } from "@/features/recipients/types";
import { numberToINR } from "@/common/utils";
import { cn } from "@/lib/utils";

import { CreateRecipientDialog } from "./create-recipient-dialog";

export function RecipientPicker({
  value,
  initialRecipients,
  error,
  onChange,
  onRecipientChange,
  inputRef,
}: {
  value: string;
  initialRecipients: RecipientListItemDto[];
  error?: string;
  onChange: (uuid: string) => void;
  onRecipientChange?: (
    recipient: Pick<RecipientListItemDto, "uuid" | "displayName"> | null,
  ) => void;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<Pick<
    RecipientListItemDto,
    "uuid" | "displayName"
  > | null>(
    initialRecipients.find((recipient) => recipient.uuid === value) ?? null,
  );
  const pickerQuery = useRecipientPickerQuery({
    q: debouncedQuery,
    initialData: initialRecipients,
  });
  const recipients = pickerQuery.data?.recipients ?? [];

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedQuery(query.trim()),
      250,
    );
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function selectRecipient(
    recipient: Pick<RecipientListItemDto, "uuid" | "displayName">,
  ) {
    setSelectedRecipient(recipient);
    setQuery("");
    setOpen(false);
    onChange(recipient.uuid);
    onRecipientChange?.(recipient);
  }

  function focusOption(index: number) {
    if (recipients.length === 0) return;
    const nextIndex = (index + recipients.length) % recipients.length;
    optionRefs.current[nextIndex]?.focus();
  }

  return (
    <>
      <div ref={rootRef} className="relative">
        <div
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-[8px] border bg-background/18 px-3.5 focus-within:ring-2 focus-within:ring-ring",
            error ? "border-destructive/65" : "border-input",
          )}
        >
          <Search
            className="h-4 w-4 shrink-0 text-secondary-foreground"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            role="combobox"
            aria-label="Recipient"
            aria-expanded={open}
            aria-controls="recipient-picker-list"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "recipient-picker-error" : undefined}
            autoComplete="off"
            value={open ? query : (selectedRecipient?.displayName ?? "")}
            placeholder="Search recipients…"
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              if (selectedRecipient) {
                setSelectedRecipient(null);
                onChange("");
                onRecipientChange?.(null);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" && recipients.length > 0) {
                event.preventDefault();
                setOpen(true);
                window.requestAnimationFrame(() => focusOption(0));
              }
              if (event.key === "Escape") {
                setOpen(false);
              }
            }}
            className="min-h-11 w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-secondary-foreground/85"
          />
        </div>

        {open ? (
          <div
            id="recipient-picker-list"
            role="listbox"
            className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-[8px] border border-border/70 bg-[linear-gradient(180deg,rgba(17,27,22,0.99),rgba(10,16,13,1))] p-1.5 shadow-[0_18px_38px_rgba(0,0,0,0.32)]"
          >
            {pickerQuery.isFetching ? (
              <div
                role="status"
                className="flex items-center gap-2 px-3 py-3 text-sm text-secondary-foreground"
              >
                <LoaderCircle className="h-4 w-4 animate-spin" /> Searching…
              </div>
            ) : pickerQuery.isError ? (
              <p role="alert" className="px-3 py-3 text-sm text-destructive">
                Recipients are temporarily unavailable.
              </p>
            ) : recipients.length > 0 ? (
              recipients.map((recipient, index) => (
                <button
                  key={recipient.uuid}
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  type="button"
                  role="option"
                  aria-selected={recipient.uuid === value}
                  onClick={() => selectRecipient(recipient)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      focusOption(index + 1);
                    } else if (event.key === "ArrowUp") {
                      event.preventDefault();
                      focusOption(index - 1);
                    } else if (event.key === "Escape") {
                      setOpen(false);
                    }
                  }}
                  className="flex min-h-12 w-full items-center gap-3 rounded-[8px] px-3 py-2 text-left transition-colors hover:bg-secondary/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <UserRound
                    className="h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {recipient.displayName}
                    </span>
                    <span className="block truncate text-xs text-secondary-foreground">
                      {recipient.transactionCount} transactions ·{" "}
                      {numberToINR(recipient.totalAmount)}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <p className="px-3 py-3 text-sm text-secondary-foreground">
                No recipients found.
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setDialogOpen(true);
              }}
              className="mt-1 flex min-h-11 w-full items-center gap-2 rounded-[8px] border-t border-border/45 px-3 pt-2 text-sm font-semibold text-primary hover:bg-secondary/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create New Recipient{query.trim() ? ` “${query.trim()}”` : ""}
            </button>
          </div>
        ) : null}
        {error ? (
          <p
            id="recipient-picker-error"
            className="mt-1.5 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}
      </div>

      <CreateRecipientDialog
        open={dialogOpen}
        suggestedName={query.trim()}
        onOpenChange={setDialogOpen}
        onSelect={selectRecipient}
      />
    </>
  );
}
