"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Check,
  CircleAlert,
  ChevronDown,
  Copy,
  MapPinned,
  LoaderCircle,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import type { TransactionRecord } from "@/common/types";
import { AppPageHeader } from "@/components/product/app-page-header";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { useCategoriesQuery } from "@/features/categories/queries";
import { useDeleteTransactionMutation, useUpdateTransactionMutation } from "@/features/transactions/mutations";
import {
  getTransactionSuggestionData,
  useTransactionQuery,
} from "@/features/transactions/queries";
import type {
  TransactionDetailFormValues,
  TransactionDetailPageInitialData,
} from "@/features/transactions/types";
import { ApiClientError, getApiClientErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  dashboardAttentionPanelClassName,
  dashboardPanelClassName,
} from "@/app/(app)/dashboard/_components/dashboard-style";

import {
  applyTransactionSuggestion,
  buildTransactionQuickChecks,
  formatTransactionAmount,
  formatTransactionDateTime,
  getRecipientDetailHref,
  getSubcategoryOptions,
  getTransactionGoogleMapsHref,
  getTransactionDisplayRecipient,
  isValidSubcategorySelection,
  mapFormValuesToTransactionPayload,
  mapTransactionToFormValues,
  parseDateTimeLocalAsIst,
  transactionDetailFormSchema,
  type TransactionDetailFormSchema,
} from "./transaction-detail-model";

const fieldClassName =
  "min-h-11 w-full rounded-[8px] border border-input bg-background/18 px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-secondary-foreground/72 focus-visible:ring-2 focus-visible:ring-ring";
const textAreaClassName = `${fieldClassName} min-h-[112px] py-3`;
const badgeClassName =
  "inline-flex min-h-8 items-center rounded-[999px] border px-3 text-sm font-medium";
const selectMenuClassName =
  "overflow-hidden rounded-[8px] border border-border/70 bg-[linear-gradient(180deg,rgba(17,27,22,0.98),rgba(10,16,13,0.99))] shadow-[0_18px_38px_rgba(0,0,0,0.32)]";

export function TransactionDetailPageView({
  transactionId,
  initialTransactionData,
  initialCategoriesData,
}: TransactionDetailPageInitialData) {
  const router = useRouter();
  const [banner, setBanner] = useState<{
    tone: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const pendingSuggestedSubcategoryRef = useRef<string | null>(null);
  const transactionQuery = useTransactionQuery({
    transactionId,
    initialData: initialTransactionData,
  });
  const categoriesQuery = useCategoriesQuery({
    initialData: initialCategoriesData,
  });
  const updateMutation = useUpdateTransactionMutation();
  const deleteMutation = useDeleteTransactionMutation();
  const transaction = transactionQuery.data ?? initialTransactionData;
  const categories = categoriesQuery.data ?? initialCategoriesData;

  const form = useForm<TransactionDetailFormSchema>({
    resolver: zodResolver(transactionDetailFormSchema),
    defaultValues: mapTransactionToFormValues(transaction),
  });

  const selectedCategoryId = form.watch("categoryId");
  const selectedSubcategoryId = form.watch("subcategoryId");
  const currentAmount = form.watch("amount");
  const currentTimestamp = form.watch("timestamp");
  const currentRecipientRaw = form.watch("recipientRaw");
  const currentRecipientName = form.watch("recipientName");
  const currentType = form.watch("type");
  const currentLocationRaw = form.watch("locationRaw");
  const subcategoryOptions = getSubcategoryOptions(categories, selectedCategoryId);
  const googleMapsHref = getTransactionGoogleMapsHref(currentLocationRaw);

  useEffect(() => {
    form.reset(mapTransactionToFormValues(transaction));
    setBanner(null);
  }, [form, transaction]);

  useEffect(() => {
    if (pendingSuggestedSubcategoryRef.current !== null) {
      const nextSuggestedSubcategory = pendingSuggestedSubcategoryRef.current;
      const matchesSuggestedOption =
        nextSuggestedSubcategory === "" ||
        subcategoryOptions.some((subcategory) => String(subcategory.id) === nextSuggestedSubcategory);

      if (matchesSuggestedOption) {
        form.setValue("subcategoryId", nextSuggestedSubcategory, { shouldDirty: true });
      }

      pendingSuggestedSubcategoryRef.current = null;
      return;
    }

    if (!isValidSubcategorySelection(categories, selectedCategoryId, selectedSubcategoryId)) {
      form.setValue("subcategoryId", "", { shouldDirty: true });
    }
  }, [categories, form, selectedCategoryId, selectedSubcategoryId, subcategoryOptions]);

  useEffect(() => {
    if (!copiedValue) {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopiedValue(null), 1200);
    return () => window.clearTimeout(timeoutId);
  }, [copiedValue]);
  const previewTransaction = {
    ...transaction,
    amount: Number(currentAmount) || transaction.amount,
    recipientRaw: currentRecipientRaw,
    recipientName: currentRecipientName.trim() || null,
    type: currentType,
    timestamp: transaction.timestamp,
    categoryId: selectedCategoryId ? Number(selectedCategoryId) : null,
    subcategoryId: selectedSubcategoryId ? Number(selectedSubcategoryId) : null,
  } satisfies TransactionRecord;
  const quickChecks = buildTransactionQuickChecks(previewTransaction);

  async function handleSubmit(values: TransactionDetailFormSchema) {
    setBanner(null);
    form.clearErrors();

    try {
      await updateMutation.mutateAsync({
        transactionId,
        ...mapFormValuesToTransactionPayload(values),
      });

      await transactionQuery.refetch();
      setBanner({ tone: "success", message: "Transaction changes saved." });
    } catch (error) {
      applyServerErrors(error, form.setError);
      setBanner({
        tone: "error",
        message: getApiClientErrorMessage(
          error,
          "Unable to save changes right now. Try again in a moment."
        ),
      });
    }
  }

  async function handleSuggest() {
    setIsSuggesting(true);

    try {
      const suggestion = await getTransactionSuggestionData(transactionId);
      const resolved = applyTransactionSuggestion(categories, suggestion);

      if (!resolved.matched) {
        toast({
          tone: "info",
          title: "No suggestion found",
          description: "No saved category suggestion was found for this recipient.",
          durationMs: 3600,
        });
        return;
      }

      pendingSuggestedSubcategoryRef.current = resolved.subcategoryId;
      form.setValue("categoryId", resolved.categoryId, { shouldDirty: true });
      form.setValue("subcategoryId", "", { shouldDirty: true });
      toast({
        tone: "success",
        title: "Suggestion applied",
        description: "Suggested classification applied. Save changes to keep it.",
        durationMs: 3200,
      });
    } catch (error) {
      toast({
        tone: "warning",
        title: "Suggestion unavailable",
        description: getApiClientErrorMessage(
          error,
          "Unable to fetch a category suggestion right now."
        ),
        durationMs: 4200,
      });
    } finally {
      setIsSuggesting(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("Delete this transaction? This action cannot be undone.");
    if (!confirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ transactionId });
      router.push("/transactions");
    } catch (error) {
      setBanner({
        tone: "error",
        message: getApiClientErrorMessage(
          error,
          "Unable to delete this transaction right now."
        ),
      });
    }
  }

  async function handleCopy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
    } catch {
      setCopiedValue(null);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3.5">
      <AppPageHeader
        eyebrow="Transaction workspace"
        title="Transaction detail"
        description="Review, classify, and correct a single transaction without leaving the ledger workspace."
        meta={
          <>
            <span className="font-medium text-foreground">TXN-{transaction.id}</span>
            <span className="text-secondary-foreground">{transaction.source}</span>
          </>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="secondary" className="min-w-[180px]">
              <Link href="/transactions">
                <ArrowLeft className="h-4 w-4" />
                Back to transactions
              </Link>
            </Button>
            <Button
              type="submit"
              className="min-w-[168px]"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save changes
            </Button>
          </div>
        }
      />

      {banner ? (
        <section
          className={cn(
            "rounded-[8px] border px-4 py-3 text-sm",
            banner.tone === "success" && "border-primary/35 bg-primary/10 text-foreground",
            banner.tone === "error" && "border-destructive/45 bg-destructive/10 text-foreground",
            banner.tone === "info" && "border-border/45 bg-background/14 text-secondary-foreground"
          )}
        >
          {banner.message}
        </section>
      ) : null}

      {transactionQuery.error ? (
        <section className="rounded-[8px] border border-destructive/45 bg-destructive/10 px-4 py-3 text-sm text-foreground">
          {getApiClientErrorMessage(
            transactionQuery.error,
            "Transaction details are temporarily unavailable."
          )}
        </section>
      ) : null}

      <div className="grid gap-3 2xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.78fr)]">
        <div className="space-y-3">
          <section className={cn(dashboardPanelClassName, "px-5 py-5")}>
            <div className="grid gap-5 xl:grid-cols-[minmax(240px,0.9fr)_minmax(0,1fr)_minmax(0,0.8fr)]">
              <div>
                <p className="text-sm font-semibold text-secondary-foreground">
                  Transaction summary
                </p>
                <p className="mt-4 text-[2.25rem] font-semibold leading-none text-primary tabular-nums">
                  {formatTransactionAmount(Number(currentAmount) || transaction.amount)}
                </p>
                <p className="mt-3 text-sm text-secondary-foreground">
                  {getSummaryLine({
                    timestamp: currentTimestamp,
                    fallbackTimestamp: transaction.timestamp,
                    type: currentType,
                  })}
                </p>
              </div>

              <DefinitionGrid
                items={[
                  { label: "Recipient", value: getTransactionDisplayRecipient(previewTransaction) },
                  { label: "Raw recipient", value: currentRecipientRaw || "Missing" },
                  { label: "Source", value: transaction.source },
                ]}
              />

              <DefinitionGrid
                items={[
                  { label: "Type", value: currentType },
                  { label: "Currency", value: transaction.currency },
                  { label: "Reference", value: form.watch("reference").trim() || "-" },
                ]}
              />
            </div>
          </section>

          <section
            className={cn(
              selectedCategoryId ? dashboardPanelClassName : dashboardAttentionPanelClassName,
              "px-5 py-5"
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-[1.05rem] font-semibold text-foreground">Classification</h2>
                <span
                  className={cn(
                    badgeClassName,
                    selectedCategoryId
                      ? "border-primary/20 bg-primary/10 text-primary"
                      : "border-accent/30 bg-accent/12 text-accent"
                  )}
                >
                  {selectedCategoryId ? "Category set" : "Needs category"}
                </span>
              </div>

              <Button
                type="button"
                variant="secondary"
                className="min-w-[148px]"
                onClick={() => void handleSuggest()}
                disabled={isSuggesting}
              >
                {isSuggesting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Suggest category
              </Button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field
                label="Category"
                error={form.formState.errors.categoryId?.message}
              >
                <Controller
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <ThemedSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { value: "", label: "Uncategorized" },
                        ...categories.map((category) => ({
                          value: String(category.id),
                          label: category.name,
                        })),
                      ]}
                    />
                  )}
                />
              </Field>

              <Field
                label="Subcategory"
                error={form.formState.errors.subcategoryId?.message}
              >
                <Controller
                  control={form.control}
                  name="subcategoryId"
                  render={({ field }) => (
                    <ThemedSelect
                      value={field.value}
                      onChange={field.onChange}
                      disabled={!selectedCategoryId || subcategoryOptions.length === 0}
                      options={[
                        {
                          value: "",
                          label: selectedCategoryId
                            ? "Select subcategory"
                            : "Choose a category first",
                        },
                        ...subcategoryOptions.map((subcategory) => ({
                          value: String(subcategory.id),
                          label: subcategory.name,
                        })),
                      ]}
                    />
                  )}
                />
              </Field>
            </div>

            <p className="mt-3 text-sm text-secondary-foreground">
              Categorized transactions are included in spend insights and dashboard drilldowns.
            </p>
          </section>

          <section className={cn(dashboardPanelClassName, "px-5 py-5")}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[1.05rem] font-semibold text-foreground">Recipient</h2>
              <Button asChild variant="secondary" className="min-w-[180px]">
                <Link href={getRecipientDetailHref(transaction)}>
                  View recipient
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field
                label="Recipient display name"
                error={form.formState.errors.recipientName?.message}
              >
                <input className={fieldClassName} {...form.register("recipientName")} />
              </Field>
              <Field label="Raw recipient" error={form.formState.errors.recipientRaw?.message}>
                <input className={fieldClassName} {...form.register("recipientRaw")} />
              </Field>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <ReadOnlyField label="Resolved recipient" value={getTransactionDisplayRecipient(previewTransaction)} />
              <ReadOnlyField label="Recipient source" value={transaction.source === "SMS" ? "Imported from SMS" : "Manual entry"} />
            </div>
          </section>

          <section className={cn(dashboardPanelClassName, "px-5 py-5")}>
            <h2 className="text-[1.05rem] font-semibold text-foreground">Payment details</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Amount" error={form.formState.errors.amount?.message}>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  className={fieldClassName}
                  {...form.register("amount")}
                />
              </Field>
              <Field label="Type" error={form.formState.errors.type?.message}>
                <Controller
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <ThemedSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { value: "UPI", label: "UPI" },
                        { value: "CARD", label: "CARD" },
                        { value: "CASH", label: "CASH" },
                        { value: "NETBANKING", label: "NETBANKING" },
                        { value: "OTHER", label: "OTHER" },
                      ]}
                    />
                  )}
                />
              </Field>
              <Field label="Timestamp" error={form.formState.errors.timestamp?.message}>
                <input type="datetime-local" className={fieldClassName} {...form.register("timestamp")} />
              </Field>
              <Field label="Account label" error={form.formState.errors.accountLabel?.message}>
                <input className={fieldClassName} {...form.register("accountLabel")} />
              </Field>
              <Field label="Reference" error={form.formState.errors.reference?.message}>
                <input className={fieldClassName} {...form.register("reference")} />
              </Field>
              <Field label="Location" error={form.formState.errors.locationRaw?.message}>
                <div className="space-y-3">
                  <input className={fieldClassName} {...form.register("locationRaw")} />
                  {googleMapsHref ? (
                    <Button asChild type="button" variant="secondary" className="min-w-[220px]">
                      <a href={googleMapsHref} target="_blank" rel="noreferrer noopener">
                        <MapPinned className="h-4 w-4" />
                        Open in Google Maps
                      </a>
                    </Button>
                  ) : null}
                </div>
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Remarks" error={form.formState.errors.remarks?.message}>
                <textarea className={textAreaClassName} {...form.register("remarks")} />
              </Field>
            </div>
          </section>
        </div>

        <aside className="space-y-3">
          <section className={cn(dashboardPanelClassName, "px-5 py-5")}>
            <h2 className="text-[1.05rem] font-semibold text-foreground">Metadata</h2>
            <div className="mt-4 space-y-1">
              <MetadataRow
                label="Transaction ID"
                value={`txn_${transaction.id}`}
                onCopy={() => void handleCopy(`txn_${transaction.id}`)}
                copied={copiedValue === `txn_${transaction.id}`}
              />
              <MetadataRow
                label="User UUID"
                value={transaction.userUuid}
                onCopy={() => void handleCopy(transaction.userUuid)}
                copied={copiedValue === transaction.userUuid}
              />
              <MetadataRow label="Created" value={formatTransactionDateTime(transaction.createdAt)} />
              <MetadataRow label="Updated" value={formatTransactionDateTime(transaction.updatedAt)} />
              <MetadataRow label="Source" value={transaction.source} />
            </div>
          </section>

          <section className={cn(dashboardPanelClassName, "px-5 py-5")}>
            <h2 className="text-[1.05rem] font-semibold text-foreground">Quick checks</h2>
            <div className="mt-4 space-y-3">
              {quickChecks.map((check) => (
                <QuickCheckRow key={check.id} label={check.label} status={check.status} />
              ))}
            </div>
          </section>

          <section className={cn(dashboardPanelClassName, "px-5 py-5")}>
            <h2 className="text-[1.05rem] font-semibold text-foreground">Recorded details</h2>
            <div className="mt-4 space-y-1">
              <MetadataRow label="Import source" value={transaction.source === "SMS" ? "SMS ingestion" : "Manual transaction"} />
              <MetadataRow label="Category" value={transaction.category ?? "Uncategorized"} />
              <MetadataRow label="Subcategory" value={transaction.subcategory ?? "-"} />
            </div>
          </section>

          <section className={cn(dashboardPanelClassName, "px-5 py-5")}>
            <h2 className="text-[1.05rem] font-semibold text-foreground">Danger zone</h2>
            <p className="mt-3 text-sm leading-6 text-secondary-foreground">
              Deleting a transaction removes it from the ledger and clears any linked raw-message reference.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="mt-4 w-full border-destructive/35 bg-destructive/10 text-destructive hover:bg-destructive/15"
              disabled={deleteMutation.isPending}
              onClick={() => void handleDelete()}
            >
              {deleteMutation.isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete transaction
            </Button>
          </section>
        </aside>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-secondary-foreground">{label}</span>
      {children}
      {error ? <span className="mt-2 block text-sm text-destructive">{error}</span> : null}
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-secondary-foreground">{label}</span>
      <div className="min-h-11 rounded-[8px] border border-border/50 bg-background/10 px-3.5 py-3 text-sm text-foreground">
        {value}
      </div>
    </div>
  );
}

function DefinitionGrid({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="grid gap-3 border-l border-border/45 pl-5">
      {items.map((item) => (
        <div key={item.label} className="grid gap-1">
          <span className="text-sm text-secondary-foreground">{item.label}</span>
          <span className="text-sm font-medium text-foreground break-all">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function MetadataRow({
  label,
  value,
  onCopy,
  copied = false,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/35 py-3 text-sm last:border-b-0 last:pb-0">
      <span className="text-secondary-foreground">{label}</span>
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-right font-medium text-foreground">{value}</span>
        {onCopy ? (
          <button
            type="button"
            onClick={onCopy}
            aria-label={`Copy ${label}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-border/45 bg-background/10 text-secondary-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {copied ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function QuickCheckRow({
  label,
  status,
}: {
  label: string;
  status: "attention" | "passed";
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[8px] border border-border/45 bg-background/10 px-3.5 py-3">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border",
            status === "attention"
              ? "border-accent/30 bg-accent/10 text-accent"
              : "border-primary/22 bg-primary/10 text-primary"
          )}
        >
          {status === "attention" ? (
            <CircleAlert className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
        </span>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <span
        className={cn(
          badgeClassName,
          status === "attention"
            ? "border-accent/30 bg-accent/12 text-accent"
            : "border-primary/20 bg-primary/10 text-primary"
        )}
      >
        {status === "attention" ? "Action needed" : "Passed"}
      </span>
    </div>
  );
}

function ThemedSelect({
  value,
  onChange,
  options,
  disabled = false,
}: {
  value: string;
  onChange: (nextValue: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | undefined>(undefined);
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0] ?? { value: "", label: "" };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function updateMenuPosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const minWidth = Math.max(rect.width, 220);
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - minWidth - 12));

      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left,
        width: rect.width,
        minWidth,
        zIndex: 80,
      });
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen]);

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

  return (
    <div ref={menuRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen((current) => !current);
          }
        }}
        className={cn(
          fieldClassName,
          "inline-flex items-center justify-between gap-3 text-left",
          disabled && "cursor-not-allowed opacity-60",
          isOpen && "border-border/70 bg-background/24"
        )}
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen
        ? createPortal(
            <div
              ref={menuPanelRef}
              role="listbox"
              style={menuStyle}
              className={selectMenuClassName}
            >
              <div className="max-h-64 overflow-y-auto py-1">
                {options.map((option) => {
                  const selected = option.value === value;

                  return (
                    <button
                      key={`${option.value}-${option.label}`}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                      }}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary/20 focus-visible:outline-none focus-visible:bg-secondary/20"
                    >
                      <span className="truncate">{option.label}</span>
                      {selected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

function getSummaryLine(input: {
  timestamp: string;
  fallbackTimestamp: string;
  type: TransactionRecord["type"];
}) {
  const parsedTimestamp = input.timestamp.trim()
    ? parseDateTimeLocalAsIst(input.timestamp)
    : null;
  const timestamp =
    parsedTimestamp && !Number.isNaN(parsedTimestamp.getTime())
      ? parsedTimestamp.toISOString()
      : input.fallbackTimestamp;
  const value = formatTransactionDateTime(timestamp);

  return `${input.type} payment • ${value}`;
}

function applyServerErrors(
  error: unknown,
  setError: ReturnType<typeof useForm<TransactionDetailFormSchema>>["setError"]
) {
  if (!(error instanceof ApiClientError) || !Array.isArray(error.body?.issues)) {
    return;
  }

  for (const issue of error.body.issues) {
    if (!issue || typeof issue !== "object" || !("path" in issue) || !("message" in issue)) {
      continue;
    }

    const pathValue = issue.path;
    const messageValue = issue.message;
    if (
      !Array.isArray(pathValue) ||
      typeof pathValue[0] !== "string" ||
      typeof messageValue !== "string"
    ) {
      continue;
    }

    const fieldName = pathValue[0];
    if (!isTransactionDetailField(fieldName)) {
      continue;
    }

    setError(fieldName, { type: "server", message: messageValue });
  }
}

function isTransactionDetailField(value: string): value is keyof TransactionDetailFormValues {
  return [
    "amount",
    "recipientRaw",
    "recipientName",
    "categoryId",
    "subcategoryId",
    "type",
    "timestamp",
    "reference",
    "accountLabel",
    "remarks",
    "locationRaw",
  ].includes(value);
}
