"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  ArrowLeft,
  ChevronDown,
  LoaderCircle,
  MapPinned,
  UserRound,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import type { TransactionRecord } from "@/common/types";
import { AppPageHeader } from "@/components/product/app-page-header";
import {
  MobileActionBar,
  MobilePageHeader,
  mobileSurfaceClassName,
} from "@/components/product/mobile/mobile-primitives";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { useCategoriesQuery } from "@/features/categories/queries";
import { useDeleteTransactionMutation, useUpdateTransactionMutation } from "@/features/transactions/mutations";
import {
  getTransactionSuggestionData,
  useTransactionQuery,
} from "@/features/transactions/queries";
import type { TransactionDetailFormValues, TransactionDetailPageInitialData } from "@/features/transactions/types";
import { ApiClientError, getApiClientErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  dashboardAttentionPanelClassName,
  dashboardPanelClassName,
} from "@/app/(app)/dashboard/_components/dashboard-style";

import {
  applyTransactionSuggestion,
  formatTransactionAmount,
  formatTransactionDateTime,
  getRecipientDetailHref,
  getSubcategoryOptions,
  getTransactionDisplayRecipient,
  getTransactionGoogleMapsHref,
  hasTransactionDetailChanges,
  isValidSubcategorySelection,
  mapFormValuesToTransactionPayload,
  mapTransactionToFormValues,
  parseDateTimeLocalAsIst,
  shouldIgnoreTransactionDetailShortcut,
  transactionDetailFormSchema,
  type TransactionDetailFormSchema,
} from "./transaction-detail-model";

const fieldClassName =
  "min-h-11 w-full rounded-[8px] border border-input bg-background/18 px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-secondary-foreground/85 focus-visible:ring-2 focus-visible:ring-ring";
const embeddedFieldClassName =
  "min-h-11 min-w-0 flex-1 bg-transparent px-3.5 text-sm text-foreground outline-none placeholder:text-secondary-foreground/85";
const embeddedActionButtonClassName =
  "group h-11 shrink-0 rounded-none border-l border-border/55 bg-background/8 px-4 shadow-none transition-colors hover:border-border/75 hover:bg-secondary/18 hover:text-foreground";
const readOnlyActionButtonClassName =
  "group min-h-11 self-stretch rounded-none border-l border-border/55 bg-background/8 px-4 shadow-none transition-colors hover:border-border/75 hover:bg-secondary/18 hover:text-foreground";
const textAreaClassName = `${fieldClassName} min-h-[112px] py-3`;
const badgeClassName =
  "inline-flex min-h-11 items-center rounded-[999px] border px-3 text-sm font-medium";
const disclosureSummaryClassName =
  "flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-foreground marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden [&::-webkit-details-marker]:hidden";
const inlineDisclosureButtonClassName =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[8px] px-0 text-sm font-semibold text-primary transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function TransactionDetailPageView({
  transactionId,
  initialTransactionData,
  initialCategoriesData,
}: TransactionDetailPageInitialData) {
  const router = useRouter();
  const [banner, setBanner] = useState<{
    tone: "error" | "info";
    message: string;
  } | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isMoreDetailsOpen, setIsMoreDetailsOpen] = useState(false);
  const pendingSuggestedSubcategoryRef = useRef<string | null>(null);
  const shortcutStateRef = useRef({
    hasUnsavedChanges: false,
    isSuggesting: false,
    isSaving: false,
  });
  const saveShortcutRef = useRef<() => void>(() => undefined);
  const suggestShortcutRef = useRef<() => void>(() => undefined);
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
  const currentType = form.watch("type");
  const currentLocationRaw = form.watch("locationRaw");
  const currentReference = form.watch("reference");
  const currentAccountLabel = form.watch("accountLabel");
  const currentRemarks = form.watch("remarks");
  const subcategoryOptions = getSubcategoryOptions(categories, selectedCategoryId);
  const googleMapsHref = getTransactionGoogleMapsHref(currentLocationRaw);
  const hasUnsavedChanges = hasTransactionDetailChanges(transaction, {
    amount: currentAmount,
    categoryId: selectedCategoryId,
    subcategoryId: selectedSubcategoryId,
    type: currentType,
    timestamp: currentTimestamp,
    reference: currentReference,
    accountLabel: currentAccountLabel,
    remarks: currentRemarks,
    locationRaw: currentLocationRaw,
  });
  shortcutStateRef.current = {
    hasUnsavedChanges,
    isSuggesting,
    isSaving: updateMutation.isPending,
  };

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

  const previewTransaction = {
    ...transaction,
    amount: Number(currentAmount) || transaction.amount,
    type: currentType,
    timestamp: transaction.timestamp,
    categoryId: selectedCategoryId ? Number(selectedCategoryId) : null,
    subcategoryId: selectedSubcategoryId ? Number(selectedSubcategoryId) : null,
  } satisfies TransactionRecord;

  async function handleSubmit(values: TransactionDetailFormSchema) {
    setBanner(null);
    form.clearErrors();

    try {
      await updateMutation.mutateAsync({
        transactionId,
        ...mapFormValuesToTransactionPayload(transaction, values),
      });

      await transactionQuery.refetch();
      toast({
        tone: "success",
        title: "Transaction saved",
        description: "Transaction changes saved.",
        durationMs: 3200,
      });
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

  saveShortcutRef.current = () => {
    void form.handleSubmit(handleSubmit)();
  };
  suggestShortcutRef.current = () => {
    void handleSuggest();
  };

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (shouldIgnoreTransactionDetailShortcut(event)) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "c" && !shortcutStateRef.current.isSuggesting) {
        event.preventDefault();
        suggestShortcutRef.current();
        return;
      }

      if (
        key === "s" &&
        !shortcutStateRef.current.isSaving &&
        shortcutStateRef.current.hasUnsavedChanges
      ) {
        event.preventDefault();
        saveShortcutRef.current();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleDelete() {
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

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3.5">
      <MobilePageHeader
        eyebrow="Transaction workspace"
        title="Transaction detail"
        meta={
          <>
            <span className="font-medium text-foreground">TXN-{transaction.id}</span>
            <span className="text-secondary-foreground">{transaction.source}</span>
          </>
        }
        actions={
          <Button asChild variant="secondary" className="w-full min-w-0">
            <Link href="/transactions">
              <ArrowLeft className="h-4 w-4" />
              Back to transactions
            </Link>
          </Button>
        }
      />
      <div className="hidden lg:block">
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
                disabled={updateMutation.isPending || !hasUnsavedChanges}
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
      </div>

      {banner ? (
        <section
          className={cn(
            "rounded-[8px] border px-4 py-3 text-sm",
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

      <div className="lg:hidden">
        <MobileTransactionSummary
          amount={formatTransactionAmount(Number(currentAmount) || transaction.amount)}
          type={currentType}
          when={getSummaryLine({
            timestamp: currentTimestamp,
            fallbackTimestamp: transaction.timestamp,
          })}
          recipient={getTransactionDisplayRecipient(previewTransaction)}
        />
      </div>

      <div className="grid gap-3 2xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.78fr)]">
        <div className="space-y-3">
          <section
            className={cn(
              selectedCategoryId ? dashboardPanelClassName : dashboardAttentionPanelClassName,
              "relative z-10 overflow-visible px-5 py-5"
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
                className="w-full min-w-0 sm:w-auto lg:min-w-[148px]"
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
                    <Select
                      ariaLabel="Category"
                      value={field.value}
                      onValueChange={field.onChange}
                      options={[
                        { value: "", label: "Uncategorized" },
                        ...categories.map((category) => ({
                          value: String(category.id),
                          label: category.name,
                        })),
                      ]}
                      triggerClassName={fieldClassName}
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
                    <Select
                      ariaLabel="Subcategory"
                      value={field.value}
                      onValueChange={field.onChange}
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
                      triggerClassName={fieldClassName}
                    />
                  )}
                />
              </Field>
            </div>

            <p className="mt-3 text-sm text-secondary-foreground">
              Categorize this transaction to include it in spending insights and dashboard
              breakdowns.
            </p>
          </section>

          <section className={cn(dashboardPanelClassName, "px-5 py-5")}>
            <h2 className="text-[1.05rem] font-semibold text-foreground">
              Transaction details
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:mt-4">
              <Field
                label="Amount"
                error={form.formState.errors.amount?.message}
                className="order-1 lg:order-none"
              >
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  className={fieldClassName}
                  {...form.register("amount")}
                />
              </Field>
              <Field
                label="Type"
                error={form.formState.errors.type?.message}
                className="order-2 lg:order-none"
              >
                <Controller
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <Select
                      ariaLabel="Transaction type"
                      value={field.value}
                      onValueChange={field.onChange}
                      options={[
                        { value: "UPI", label: "UPI" },
                        { value: "CARD", label: "CARD" },
                        { value: "CASH", label: "CASH" },
                        { value: "NETBANKING", label: "NETBANKING" },
                        { value: "OTHER", label: "OTHER" },
                      ]}
                      triggerClassName={fieldClassName}
                    />
                  )}
                />
              </Field>
              <Field
                label="Timestamp"
                error={form.formState.errors.timestamp?.message}
                className={cn(
                  "order-6 lg:order-none",
                  !isMoreDetailsOpen && "hidden lg:block"
                )}
              >
                <input
                  type="datetime-local"
                  className={fieldClassName}
                  {...form.register("timestamp")}
                />
              </Field>
              <Field
                label="Account label"
                error={form.formState.errors.accountLabel?.message}
                className={cn(
                  "order-6 lg:order-none",
                  !isMoreDetailsOpen && "hidden lg:block"
                )}
              >
                <input className={fieldClassName} {...form.register("accountLabel")} />
              </Field>

              <ReadOnlyActionField
                label="Recipient"
                value={getTransactionDisplayRecipient(previewTransaction)}
                className="order-3 lg:order-none"
                action={
                  <Button
                    asChild
                    type="button"
                    variant="secondary"
                    className={readOnlyActionButtonClassName}
                  >
                    <Link href={getRecipientDetailHref(transaction)}>
                      View recipient
                      <UserRound className="h-4 w-4" />
                    </Link>
                  </Button>
                }
              />
              <Field
                label="Reference"
                error={form.formState.errors.reference?.message}
                className={cn(
                  "order-6 lg:order-none",
                  !isMoreDetailsOpen && "hidden lg:block"
                )}
              >
                <input className={fieldClassName} {...form.register("reference")} />
              </Field>
              <Field
                label="Location"
                error={form.formState.errors.locationRaw?.message}
                className="order-4 md:col-span-2 lg:order-none"
              >
                <div className="flex min-h-11 overflow-hidden rounded-[8px] border border-input bg-background/18 focus-within:ring-2 focus-within:ring-ring">
                  <input className={embeddedFieldClassName} {...form.register("locationRaw")} />
                  {googleMapsHref ? (
                    <Button
                      asChild
                      type="button"
                      variant="secondary"
                      className={embeddedActionButtonClassName}
                    >
                      <a href={googleMapsHref} target="_blank" rel="noreferrer noopener">
                        Open map
                        <MapPinned className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : null}
                </div>
              </Field>
              <Field
                label="Remarks"
                error={form.formState.errors.remarks?.message}
                className="order-5 md:col-span-2 lg:order-none"
              >
                <textarea className={textAreaClassName} {...form.register("remarks")} />
              </Field>
              <div className="order-6 md:col-span-2 lg:hidden">
                <button
                  type="button"
                  className={inlineDisclosureButtonClassName}
                  aria-expanded={isMoreDetailsOpen}
                  onClick={() => setIsMoreDetailsOpen((current) => !current)}
                >
                  <span>More details</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-secondary-foreground transition-transform",
                      isMoreDetailsOpen && "rotate-180"
                    )}
                  />
                </button>
              </div>
            </div>
          </section>

          <MobileDangerZone
            transactionId={transaction.id}
            isDeleting={deleteMutation.isPending}
            onDelete={handleDelete}
          />
        </div>

        <aside className="hidden space-y-3 lg:block">
          <DangerZone
            transactionId={transaction.id}
            isDeleting={deleteMutation.isPending}
            onDelete={handleDelete}
          />
        </aside>
      </div>

      <MobileActionBar>
        <Button type="submit" disabled={updateMutation.isPending || !hasUnsavedChanges}>
          {updateMutation.isPending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save changes
        </Button>
      </MobileActionBar>
    </form>
  );
}

function MobileTransactionSummary({
  amount,
  type,
  when,
  recipient,
}: {
  amount: string;
  type: TransactionRecord["type"];
  when: string;
  recipient: string;
}) {
  return (
    <section className={cn(mobileSurfaceClassName, "px-4 py-3.5")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-secondary-foreground">Amount</p>
          <p className="mt-1 text-[1.75rem] font-semibold leading-tight tabular-nums text-primary">
            {amount}
          </p>
        </div>
        <span className="shrink-0 rounded-[999px] border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
          {type}
        </span>
      </div>
      <div className="mt-3 grid gap-2 border-t border-border/35 pt-3 text-sm">
        <SummaryRow label="Date and Time" value={when} />
        <SummaryRow label="Recipient" value={recipient} />
      </div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-secondary-foreground">{label}</span>
      <span className="overflow-wrap-anywhere min-w-0 text-right font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

function MobileDangerZone({
  transactionId,
  isDeleting,
  onDelete,
}: {
  transactionId: number;
  isDeleting: boolean;
  onDelete: () => Promise<void>;
}) {
  return (
    <details className={cn(dashboardPanelClassName, "group px-4 py-3 lg:hidden")}>
      <summary className={disclosureSummaryClassName}>
        <span>Danger zone</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-secondary-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="pt-3">
        <DangerZoneContent
          transactionId={transactionId}
          isDeleting={isDeleting}
          onDelete={onDelete}
        />
      </div>
    </details>
  );
}

function DangerZone({
  transactionId,
  isDeleting,
  onDelete,
}: {
  transactionId: number;
  isDeleting: boolean;
  onDelete: () => Promise<void>;
}) {
  return (
    <section className={cn(dashboardPanelClassName, "px-5 py-5")}>
      <h2 className="text-[1.05rem] font-semibold text-foreground">Danger zone</h2>
      <DangerZoneContent
        transactionId={transactionId}
        isDeleting={isDeleting}
        onDelete={onDelete}
      />
    </section>
  );
}

function DangerZoneContent({
  transactionId,
  isDeleting,
  onDelete,
}: {
  transactionId: number;
  isDeleting: boolean;
  onDelete: () => Promise<void>;
}) {
  return (
    <>
      <p className="mt-3 text-sm leading-6 text-secondary-foreground">
        Deleting this transaction removes it from the ledger and unlinks any raw-message reference.
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="destructive"
            className="mt-4 w-full"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete transaction
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes TXN-{transactionId} from the ledger and unlinks any
              raw-message reference. This action cannot be undone.
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
                disabled={isDeleting}
                onClick={() => void onDelete()}
              >
                {isDeleting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete transaction
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-2 block text-sm font-medium text-secondary-foreground">{label}</span>
      {children}
      {error ? <span className="mt-2 block text-sm text-destructive">{error}</span> : null}
    </label>
  );
}

function ReadOnlyActionField({
  label,
  value,
  action,
  className,
}: {
  label: string;
  value: string;
  action: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="mb-2 block text-sm font-medium text-secondary-foreground">{label}</span>
      <div className="flex min-h-11 overflow-hidden rounded-[8px] border border-border/50 bg-background/10">
        <div className="overflow-wrap-anywhere flex min-w-0 flex-1 items-center px-3.5 py-3 text-sm text-foreground">
          {value}
        </div>
        {action}
      </div>
    </div>
  );
}

function getSummaryLine(input: {
  timestamp: string;
  fallbackTimestamp: string;
}) {
  const parsedTimestamp = input.timestamp.trim()
    ? parseDateTimeLocalAsIst(input.timestamp)
    : null;
  const timestamp =
    parsedTimestamp && !Number.isNaN(parsedTimestamp.getTime())
      ? parsedTimestamp.toISOString()
      : input.fallbackTimestamp;
  return formatTransactionDateTime(timestamp);
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
