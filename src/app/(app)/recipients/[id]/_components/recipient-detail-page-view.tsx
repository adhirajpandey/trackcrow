"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Copy,
  LoaderCircle,
  Plus,
} from "lucide-react";

import { AppPageHeader } from "@/components/product/app-page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { useCategoriesQuery } from "@/features/categories/queries";
import {
  type IdentifierTransferImpact,
  useAddRecipientIdentifierMutation,
} from "@/features/recipients/mutations";
import type { RecipientDetailPageInitialData } from "@/features/recipients/types";
import { useUpdateTransactionCategoryMutation } from "@/features/transactions/mutations";
import { ApiClientError, getApiClientErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  dashboardInnerTableClassName,
  dashboardPanelClassName,
} from "@/app/(app)/dashboard/_components/dashboard-style";
import { TransactionsTable } from "@/app/(app)/transactions/_components/transactions-table";
import {
  paginateTransactionTableRows,
  sortTransactionTableRows,
  toggleTransactionTableSort,
  transactionTablePageSize,
} from "@/app/(app)/transactions/_components/transactions-table-model";
import type {
  TransactionSortBy,
  TransactionSortOrder,
} from "@/features/transactions/types";

import {
  formatRecipientDate,
  formatRecipientTotal,
} from "./recipient-detail-model";

const badgeClassName =
  "inline-flex min-h-8 items-center rounded-[999px] border px-3 text-sm font-medium";
const fieldClassName =
  "min-h-11 w-full rounded-[8px] border border-input bg-background/18 px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-secondary-foreground/72 focus-visible:ring-2 focus-visible:ring-ring";
const selectMenuClassName =
  "overflow-hidden rounded-[8px] border border-border/70 bg-[linear-gradient(180deg,rgba(17,27,22,0.98),rgba(10,16,13,0.99))] shadow-[0_18px_38px_rgba(0,0,0,0.32)]";

const identifierKindOptions = [
  { value: "AUTO", label: "Auto-detect" },
  { value: "UPI_ID", label: "UPI ID" },
  { value: "PHONE", label: "Phone" },
  { value: "CARD_MERCHANT", label: "Card merchant" },
  { value: "BANK_ACCOUNT", label: "Bank account" },
  { value: "TEXT", label: "Text" },
];

export function RecipientDetailPageView({
  initialRecipientDetailData,
  initialCategoriesData,
}: RecipientDetailPageInitialData) {
  const router = useRouter();
  const data = initialRecipientDetailData;
  const categoriesQuery = useCategoriesQuery({ initialData: initialCategoriesData });
  const categories = categoriesQuery.data ?? initialCategoriesData;
  const updateCategoryMutation = useUpdateTransactionCategoryMutation();
  const addIdentifierMutation = useAddRecipientIdentifierMutation();
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [identifierDialogOpen, setIdentifierDialogOpen] = useState(false);
  const [identifierValue, setIdentifierValue] = useState("");
  const [identifierKind, setIdentifierKind] = useState("AUTO");
  const [pendingTransfer, setPendingTransfer] = useState<IdentifierTransferImpact | null>(null);
  const [relatedTransactionsPage, setRelatedTransactionsPage] = useState(1);
  const [relatedTransactionsSort, setRelatedTransactionsSort] = useState<{
    sortBy: TransactionSortBy;
    sortOrder: TransactionSortOrder;
  }>({ sortBy: "timestamp", sortOrder: "desc" });

  const cleanup = data.cleanupSuggestion;
  const categoryExists = cleanup.categoryId
    ? categories.some((category) => category.id === cleanup.categoryId)
    : false;
  const subcategoryExists =
    cleanup.categoryId && cleanup.subcategoryId
      ? categories
          .find((category) => category.id === cleanup.categoryId)
          ?.subcategories.some((subcategory) => subcategory.id === cleanup.subcategoryId) ?? false
      : false;
  const effectiveSubcategoryId = subcategoryExists ? cleanup.subcategoryId : null;
  const suggestionLabel = [cleanup.category, subcategoryExists ? cleanup.subcategory : null]
    .filter(Boolean)
    .join(" · ");
  const canApplySuggestion =
    categoryExists && cleanup.categoryId != null && cleanup.uncategorizedTransactionIds.length > 0;
  const statusRows = [
    {
      id: "linked",
      label: "Recipient linked",
      status: data.transactionCount > 0 ? "passed" : "attention",
      badgeLabel: data.transactionCount > 0 ? "Passed" : "Action needed",
    },
    {
      id: "identifiers",
      label: "Has identifiers",
      status: data.identifiers.length > 0 ? "passed" : "attention",
      badgeLabel: data.identifiers.length > 0 ? "Passed" : "Missing",
    },
    {
      id: "categorization",
      label: "Cleanup",
      status: cleanup.uncategorizedCount > 0 ? "attention" : "passed",
      badgeLabel:
        cleanup.uncategorizedCount > 0
          ? `${cleanup.uncategorizedCount} uncategorized`
          : "No issues",
    },
  ] as const;

  const sortedRelatedTransactions = useMemo(
    () =>
      sortTransactionTableRows(
        data.recentTransactions,
        relatedTransactionsSort.sortBy,
        relatedTransactionsSort.sortOrder
      ),
    [data.recentTransactions, relatedTransactionsSort.sortBy, relatedTransactionsSort.sortOrder]
  );
  const relatedTransactions = useMemo(
    () =>
      paginateTransactionTableRows(
        sortedRelatedTransactions,
        relatedTransactionsPage,
        transactionTablePageSize
      ),
    [relatedTransactionsPage, sortedRelatedTransactions]
  );

  useEffect(() => {
    if (!copiedValue) {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopiedValue(null), 1200);
    return () => window.clearTimeout(timeoutId);
  }, [copiedValue]);

  async function handleCopy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
    } catch {
      setCopiedValue(null);
    }
  }

  async function handleApplySuggestion() {
    if (!canApplySuggestion || cleanup.categoryId == null) {
      return;
    }

    try {
      await Promise.all(
        cleanup.uncategorizedTransactionIds.map((transactionId) =>
          updateCategoryMutation.mutateAsync({
            transactionId,
            categoryId: cleanup.categoryId,
            ...(effectiveSubcategoryId ? { subcategoryId: effectiveSubcategoryId } : {}),
          })
        )
      );
      toast({
        tone: "success",
        title: "Cleanup applied",
        description: `${cleanup.uncategorizedTransactionIds.length} transaction${
          cleanup.uncategorizedTransactionIds.length === 1 ? "" : "s"
        } updated to ${suggestionLabel}.`,
        durationMs: 3400,
      });
      router.refresh();
    } catch (error) {
      toast({
        tone: "warning",
        title: "Cleanup unavailable",
        description: getApiClientErrorMessage(
          error,
          "Unable to apply this category right now."
        ),
        durationMs: 4200,
      });
    }
  }

  async function handleAddIdentifier(transfer = false) {
    const trimmedValue = identifierValue.trim();
    if (!trimmedValue) {
      return;
    }

    try {
      const result = await addIdentifierMutation.mutateAsync({
        recipientId: data.recipientId,
        value: trimmedValue,
        kind: identifierKind,
        transfer,
      });
      toast({
        tone: "success",
        title: result.status === "moved" ? "Identifier moved" : "Identifier added",
        description:
          result.status === "moved"
            ? `${result.movedTransactionCount} transaction${
                result.movedTransactionCount === 1 ? "" : "s"
              } totaling ${formatRecipientTotal(result.movedTransactionTotalAmount)} moved.`
            : "Recipient matching has been updated.",
        durationMs: 3600,
      });
      setIdentifierDialogOpen(false);
      setPendingTransfer(null);
      setIdentifierValue("");
      setIdentifierKind("AUTO");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 409) {
        const impact = parseTransferImpact(error.body?.details);
        if (impact) {
          setPendingTransfer(impact);
          return;
        }
      }

      toast({
        tone: "warning",
        title: "Identifier unavailable",
        description: getApiClientErrorMessage(
          error,
          "Unable to add this identifier right now."
        ),
        durationMs: 4200,
      });
    }
  }

  return (
    <div className="space-y-3">
      <AppPageHeader
        eyebrow="Recipient workspace"
        title="Recipient detail"
        description="Fix categorization gaps, manage matching identifiers, and trace linked payments."
        meta={
          <>
            <span className="break-all font-medium text-foreground">{data.displayName}</span>
            <span className="text-secondary-foreground">
              {data.transactionCount} transactions linked
            </span>
          </>
        }
        actions={
          <Button asChild variant="secondary" className="min-w-[176px]">
            <Link href="/recipients">
              <ArrowLeft className="h-4 w-4" />
              Back to recipients
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 2xl:grid-cols-[minmax(0,1.62fr)_minmax(300px,0.7fr)]">
        <main className="space-y-3">
          <section className={cn(dashboardPanelClassName, "px-5 py-4")}>
            <p className="text-sm font-semibold text-secondary-foreground">Recipient summary</p>
            <h2 className="mt-2 max-w-[920px] text-2xl font-semibold leading-tight text-primary sm:text-3xl">
              {data.displayName}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricBlock label="Total spent" value={formatRecipientTotal(data.totalSpent)} />
              <MetricBlock label="Transactions" value={String(data.transactionCount)} />
              <MetricBlock label="Avg amount" value={formatRecipientTotal(data.averagePayment)} />
              <MetricBlock
                label="Latest txn"
                value={data.lastPaidAt ? formatRecipientDate(data.lastPaidAt) : "No payments"}
              />
            </div>
          </section>

          <section className={cn(dashboardPanelClassName, "px-5 py-4")}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-secondary-foreground">Category pattern</p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">
                  {data.dominantCategory
                    ? `${data.dominantCategory.category} · ${data.dominantCategory.consistencyPercent}% consistency`
                    : "No dominant category yet"}
                </h2>
                <p className="mt-2 text-sm text-secondary-foreground">
                  {data.dominantCategory
                    ? `${data.dominantCategory.transactionCount} of ${data.transactionCount} transactions · ${formatRecipientTotal(data.dominantCategory.totalAmount)}`
                    : "Categorized transactions will help reveal this pattern."}
                </p>
                {data.dominantSubcategory ? (
                  <p className="mt-2 text-sm text-secondary-foreground">
                    Most common subcategory:{" "}
                    <span className="font-medium text-foreground">
                      {data.dominantSubcategory.subcategory}
                    </span>{" "}
                    · {data.dominantSubcategory.transactionCount} transactions
                  </p>
                ) : null}
                <p className="mt-2 text-sm text-accent">
                  {cleanup.uncategorizedCount > 0
                    ? `${cleanup.uncategorizedCount} transaction${
                        cleanup.uncategorizedCount === 1 ? " still needs" : " still need"
                      } a category`
                    : "All linked transactions have categories"}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleApplySuggestion()}
                disabled={!canApplySuggestion || updateCategoryMutation.isPending}
                className="shrink-0"
              >
                {cleanup.applyLabel
                  ? `${cleanup.applyLabel} to ${cleanup.uncategorizedCount} transaction${
                      cleanup.uncategorizedCount === 1 ? "" : "s"
                    }`
                  : "Apply category"}
              </Button>
            </div>
          </section>

          <section className={cn(dashboardPanelClassName, "overflow-hidden")}>
            <div className="flex flex-col gap-3 px-5 pb-4 pt-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-[1.05rem] font-semibold leading-tight text-foreground">
                  Identifiers
                </h2>
                <p className="mt-1.5 text-sm leading-5 text-secondary-foreground">
                  Identifiers match incoming SMS payments to this recipient.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIdentifierDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add identifier
              </Button>
            </div>
            <div className="overflow-x-auto px-5 pb-5">
              <div className={dashboardInnerTableClassName}>
                <Table className="min-w-[780px] table-fixed">
                  <TableHeader className="border-b border-border/40 bg-background/16">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[14%]">Kind</TableHead>
                      <TableHead className="w-[30%]">Value</TableHead>
                      <TableHead className="w-[16%] text-right">Transactions</TableHead>
                      <TableHead className="w-[24%]">Source</TableHead>
                      <TableHead className="w-[8%] text-right">Copy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.identifiers.length > 0 ? (
                      data.identifiers.map((identifier) => (
                        <TableRow key={identifier.id}>
                          <TableCell className="py-4 font-medium text-primary">
                            {identifier.kindLabel}
                          </TableCell>
                          <TableCell className="min-w-0 break-all py-4 font-medium text-foreground">
                            {identifier.value}
                          </TableCell>
                          <TableCell className="py-4 text-right font-medium tabular-nums text-foreground">
                            {identifier.transactionCount}
                          </TableCell>
                          <TableCell className="py-4 text-secondary-foreground">
                            {identifier.sourceLabel}
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <CopyButton
                              label="Copy identifier"
                              onClick={() => void handleCopy(identifier.value)}
                              copied={copiedValue === identifier.value}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-sm text-secondary-foreground">
                          No identifiers recorded for this recipient.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </section>

          <section className={cn(dashboardPanelClassName, "overflow-hidden")}>
            <div className="px-5 pb-4 pt-5">
              <div>
                <h2 className="text-[1.05rem] font-semibold leading-tight text-foreground">
                  Related transactions
                </h2>
                <p className="mt-1.5 text-sm leading-5 text-secondary-foreground">
                  Trace the transactions behind this recipient pattern.
                </p>
              </div>
            </div>
            <TransactionsTable
              className="mx-5 mb-5"
              rows={relatedTransactions.rows}
              columns={["timestamp", "amount", "category", "subcategory"]}
              variant="embedded"
              sort={{
                sortBy: relatedTransactionsSort.sortBy,
                sortOrder: relatedTransactionsSort.sortOrder,
                sortableColumns: ["timestamp", "amount"],
                onSort: (sortBy) => {
                  setRelatedTransactionsSort((current) =>
                    toggleTransactionTableSort(current, sortBy)
                  );
                  setRelatedTransactionsPage(1);
                },
              }}
              pagination={{
                ...relatedTransactions.pagination,
                onPageChange: setRelatedTransactionsPage,
              }}
              rowHref={(transaction) => `/transactions/${transaction.id}`}
              onNavigate={router.push}
              emptyTitle="No linked transactions found for this recipient."
            />
          </section>
        </main>

        <aside className="space-y-3">
          <section className={cn(dashboardPanelClassName, "px-5 py-5")}>
            <h2 className="text-[1.05rem] font-semibold text-foreground">Status</h2>
            <div className="mt-4 space-y-3">
              {statusRows.map((check) => (
                <QuickCheckRow
                  key={check.id}
                  label={check.label}
                  status={check.status}
                  badgeLabel={check.badgeLabel}
                />
              ))}
            </div>
          </section>

        </aside>
      </div>

      <Dialog open={identifierDialogOpen} onOpenChange={setIdentifierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add identifier</DialogTitle>
            <DialogDescription>
              Identifiers match incoming SMS payments to this recipient.
            </DialogDescription>
          </DialogHeader>
          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleAddIdentifier(false);
            }}
          >
            <Field label="Identifier value">
              <input
                className={fieldClassName}
                value={identifierValue}
                onChange={(event) => setIdentifierValue(event.target.value)}
                placeholder="merchant@upi or narration text"
              />
            </Field>
            <Field label="Kind">
              <ThemedSelect
                value={identifierKind}
                onChange={setIdentifierKind}
                options={identifierKindOptions}
              />
            </Field>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIdentifierDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!identifierValue.trim() || addIdentifierMutation.isPending}
              >
                {addIdentifierMutation.isPending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : null}
                Add identifier
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(pendingTransfer)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingTransfer(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move identifier?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingTransfer ? (
                <>
                  This identifier is linked to {pendingTransfer.sourceRecipient.displayName}.
                  Moving it to {pendingTransfer.targetRecipient.displayName} will also move{" "}
                  {pendingTransfer.transactionCount} transaction
                  {pendingTransfer.transactionCount === 1 ? "" : "s"} totaling{" "}
                  {formatRecipientTotal(pendingTransfer.totalAmount)}.
                  {pendingTransfer.transactionCount === 0 ? " No transactions will move." : ""}
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleAddIdentifier(true)}
                disabled={addIdentifierMutation.isPending}
              >
                Move identifier
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function parseTransferImpact(value: unknown): IdentifierTransferImpact | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const impact = value as Partial<IdentifierTransferImpact>;
  if (
    !impact.sourceRecipient ||
    !impact.targetRecipient ||
    typeof impact.transactionCount !== "number" ||
    typeof impact.totalAmount !== "number"
  ) {
    return null;
  }

  return impact as IdentifierTransferImpact;
}

function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-border/45 bg-background/10 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary-foreground/80">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-secondary-foreground">{label}</span>
      {children}
    </label>
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

function CopyButton({
  label,
  onClick,
  copied,
}: {
  label: string;
  onClick: () => void;
  copied: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-border/45 bg-background/10 text-secondary-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {copied ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function QuickCheckRow({
  label,
  status,
  badgeLabel,
}: {
  label: string;
  status: "attention" | "passed";
  badgeLabel: string;
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
        {badgeLabel}
      </span>
    </div>
  );
}
