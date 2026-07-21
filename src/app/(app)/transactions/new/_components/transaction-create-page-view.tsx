"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ChevronDown,
  LoaderCircle,
  Plus,
  ReceiptText,
} from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";

import {
  formatTransactionAmount,
  formatTransactionDateTime,
  getSubcategoryOptions,
  isValidSubcategorySelection,
  parseDateTimeLocalAsIst,
} from "@/app/(app)/transactions/[id]/_components/transaction-detail-model";
import {
  dashboardAttentionPanelClassName,
  dashboardPanelClassName,
} from "@/app/(app)/dashboard/_components/dashboard-style";
import { AppPageHeader } from "@/components/product/app-page-header";
import {
  MobileActionBar,
  MobilePageHeader,
} from "@/components/product/mobile/mobile-primitives";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { useCategoriesQuery } from "@/features/categories/queries";
import { useCreateTransactionMutation } from "@/features/transactions/mutations";
import type { TransactionCreatePageInitialData } from "@/features/transactions/types";
import { ApiClientError, getApiClientErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

import { RecipientPicker } from "@/components/product/recipient-picker";
import {
  AUTO_CLASSIFY_VALUE,
  getCreateTransactionDefaultValues,
  mapCreateFormValuesToPayload,
  transactionCreateFormSchema,
  type TransactionCreateFormSchema,
} from "./transaction-create-model";

const fieldClassName =
  "min-h-11 w-full rounded-[8px] border-2 border-input bg-card px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-secondary-foreground/85 focus-visible:ring-2 focus-visible:ring-ring";
const textAreaClassName = `${fieldClassName} min-h-[112px] py-3`;

export function TransactionCreatePageView({
  initialCategoriesData,
  initialRecipientsData,
}: TransactionCreatePageInitialData) {
  const router = useRouter();
  const categoriesQuery = useCategoriesQuery({
    initialData: initialCategoriesData,
  });
  const createMutation = useCreateTransactionMutation();
  const [banner, setBanner] = useState<string | null>(null);
  const [moreDetailsOpen, setMoreDetailsOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{
    uuid: string;
    displayName: string;
  } | null>(null);
  const categories = categoriesQuery.data ?? initialCategoriesData;
  const form = useForm<TransactionCreateFormSchema>({
    resolver: zodResolver(transactionCreateFormSchema),
    defaultValues: getCreateTransactionDefaultValues(),
  });

  const [amount = "", categoryUuid = "", subcategoryUuid = "", transactionType = "UPI", timestamp = ""] =
    useWatch({
      control: form.control,
      name: ["amount", "categoryUuid", "subcategoryUuid", "type", "timestamp"],
    });
  const subcategories = getSubcategoryOptions(categories, categoryUuid);
  const selectedCategory = categories.find(
    (item) => item.uuid === categoryUuid,
  );
  const selectedSubcategory = subcategories.find(
    (item) => item.uuid === subcategoryUuid,
  );

  useEffect(() => {
    if (
      !isValidSubcategorySelection(categories, categoryUuid, subcategoryUuid)
    ) {
      form.setValue("subcategoryUuid", "", { shouldDirty: true });
    }
  }, [categories, categoryUuid, form, subcategoryUuid]);

  useEffect(() => {
    function warnOnUnload(event: BeforeUnloadEvent) {
      if (!form.formState.isDirty) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warnOnUnload);
    return () => window.removeEventListener("beforeunload", warnOnUnload);
  }, [form.formState.isDirty]);

  function canLeave() {
    return (
      !form.formState.isDirty ||
      window.confirm("Discard this unsaved transaction?")
    );
  }

  async function handleSubmit(values: TransactionCreateFormSchema) {
    setBanner(null);
    form.clearErrors();

    try {
      const created = await createMutation.mutateAsync(
        mapCreateFormValuesToPayload(values),
      );
      toast({
        tone: "success",
        title: "Transaction created",
        description: "The manual transaction was added to your workspace.",
        durationMs: 3200,
      });
      router.push(`/transactions/${created.uuid}`);
    } catch (error) {
      applyServerErrors(error, form.setError);
      setBanner(
        getApiClientErrorMessage(
          error,
          "Unable to create this transaction right now.",
        ),
      );
    }
  }

  const parsedTimestamp = parseDateTimeLocalAsIst(timestamp);
  const summaryTimestamp = Number.isNaN(parsedTimestamp.getTime())
    ? null
    : parsedTimestamp.toISOString();

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-3.5 pb-2"
    >
      <MobilePageHeader
        eyebrow="Transaction workspace"
        title="Add Transaction"
        description="Record a payment that was not captured automatically."
        actions={
          <Button asChild variant="secondary" className="w-full">
            <Link
              href="/transactions"
              onClick={(event) => !canLeave() && event.preventDefault()}
            >
              <ArrowLeft className="h-4 w-4" /> Back to Transactions
            </Link>
          </Button>
        }
      />
      <div className="hidden lg:block">
        <AppPageHeader
          eyebrow="Transaction workspace"
          title="Add Transaction"
          description="Record a payment that was not captured from SMS or an automatic import."
          meta={
            <span className="inline-flex min-h-8 items-center rounded-[999px] border-2 border-border bg-[var(--paper-mint)] px-3 text-xs font-semibold text-foreground">
              Manual entry
            </span>
          }
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary">
                <Link
                  href="/transactions"
                  onClick={(event) => !canLeave() && event.preventDefault()}
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Transactions
                </Link>
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {createMutation.isPending ? "Creating…" : "Create Transaction"}
              </Button>
            </div>
          }
        />
      </div>

      {banner ? (
        <section
          role="alert"
          className="rounded-[8px] border-2 border-destructive bg-destructive/10 px-4 py-3 text-sm text-foreground"
        >
          {banner}
        </section>
      ) : null}

      <div className="grid gap-3 2xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.72fr)]">
        <div className="space-y-3">
          <section className={cn(dashboardPanelClassName, "overflow-visible p-5")}>
            <SectionHeading number="1" title="Payment" />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field
                label="Amount"
                error={form.formState.errors.amount?.message}
              >
                <div className="flex min-h-11 items-center rounded-[8px] border-2 border-input bg-card focus-within:ring-2 focus-within:ring-ring">
                  <span className="border-r-2 border-border px-3.5 text-sm text-secondary-foreground">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    autoComplete="off"
                    className="min-h-11 w-full min-w-0 bg-transparent px-3.5 text-sm text-foreground outline-none"
                    {...form.register("amount")}
                  />
                </div>
              </Field>
              <Field label="Type" error={form.formState.errors.type?.message}>
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
                        { value: "CARD", label: "Card" },
                        { value: "CASH", label: "Cash" },
                        { value: "NETBANKING", label: "Net banking" },
                        { value: "OTHER", label: "Other" },
                      ]}
                    />
                  )}
                />
              </Field>
              <div className="min-w-0 text-sm font-medium text-foreground md:col-span-2">
                <span>Recipient</span>
                <div className="mt-2">
                  <Controller
                    control={form.control}
                    name="recipientUuid"
                    render={({ field }) => (
                      <RecipientPicker
                        value={field.value}
                        initialRecipients={initialRecipientsData}
                        error={form.formState.errors.recipientUuid?.message}
                        onChange={field.onChange}
                        onRecipientChange={setSelectedRecipient}
                        inputRef={field.ref}
                      />
                    )}
                  />
                </div>
              </div>
              <Field
                label="Date and time"
                error={form.formState.errors.timestamp?.message}
                className="md:col-span-2"
              >
                <input
                  type="datetime-local"
                  autoComplete="off"
                  className={fieldClassName}
                  {...form.register("timestamp")}
                />
              </Field>
            </div>
          </section>

          <section
            className={cn(
              categoryUuid !== "" ? dashboardPanelClassName : dashboardAttentionPanelClassName,
              "overflow-visible p-5"
            )}
          >
            <SectionHeading number="2" title="Classification" optional />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field
                label="Category"
                error={form.formState.errors.categoryUuid?.message}
              >
                <Controller
                  control={form.control}
                  name="categoryUuid"
                  render={({ field }) => (
                    <Select
                      ariaLabel="Category"
                      value={field.value}
                      onValueChange={field.onChange}
                      options={[
                        { value: AUTO_CLASSIFY_VALUE, label: "Auto-classify" },
                        { value: "", label: "Uncategorized" },
                        ...categories.map((category) => ({
                          value: category.uuid,
                          label: category.name,
                        })),
                      ]}
                    />
                  )}
                />
              </Field>
              <Field
                label="Subcategory"
                error={form.formState.errors.subcategoryUuid?.message}
              >
                <Controller
                  control={form.control}
                  name="subcategoryUuid"
                  render={({ field }) => (
                    <Select
                      ariaLabel="Subcategory"
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!categoryUuid || categoryUuid === AUTO_CLASSIFY_VALUE || subcategories.length === 0}
                      options={[
                        {
                          value: "",
                          label: categoryUuid && categoryUuid !== AUTO_CLASSIFY_VALUE
                            ? "No subcategory"
                            : "Choose a category first",
                        },
                        ...subcategories.map((subcategory) => ({
                          value: subcategory.uuid,
                          label: subcategory.name,
                        })),
                      ]}
                    />
                  )}
                />
              </Field>
            </div>
          </section>

          <section className={cn(dashboardPanelClassName, "p-5")}>
            <button
              type="button"
              className="flex min-h-11 w-full items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:pointer-events-none lg:min-h-0"
              aria-expanded={moreDetailsOpen}
              onClick={() => setMoreDetailsOpen((open) => !open)}
            >
              <SectionHeading number="3" title="More Details" optional />
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform lg:hidden",
                  moreDetailsOpen && "rotate-180",
                )}
              />
            </button>
            <div
              className={cn(
                "mt-4 gap-4 md:grid-cols-2",
                moreDetailsOpen ? "grid" : "hidden lg:grid",
              )}
            >
              <Field
                label="Account label"
                error={form.formState.errors.accountLabel?.message}
              >
                <input
                  autoComplete="off"
                  className={fieldClassName}
                  {...form.register("accountLabel")}
                />
              </Field>
              <Field
                label="Reference"
                error={form.formState.errors.reference?.message}
              >
                <input
                  autoComplete="off"
                  className={fieldClassName}
                  {...form.register("reference")}
                />
              </Field>
              <Field
                label="Location"
                error={form.formState.errors.locationRaw?.message}
                className="md:col-span-2"
              >
                <input
                  autoComplete="off"
                  className={fieldClassName}
                  {...form.register("locationRaw")}
                />
              </Field>
              <Field
                label="Remarks"
                error={form.formState.errors.remarks?.message}
                className="md:col-span-2"
              >
                <textarea
                  className={textAreaClassName}
                  {...form.register("remarks")}
                />
              </Field>
            </div>
          </section>

          <div className="hidden justify-end gap-2 lg:flex">
            <Button
              type="button"
              variant="secondary"
              onClick={() => canLeave() && router.push("/transactions")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {createMutation.isPending ? "Creating…" : "Create Transaction"}
            </Button>
          </div>
        </div>

        <aside
          className={cn(dashboardPanelClassName, "hidden h-fit p-5 2xl:block")}
        >
          <div className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-base font-semibold text-foreground">
              Transaction Summary
            </h2>
          </div>
          <p className="mt-5 text-3xl font-semibold tabular-nums text-foreground">
            {Number(amount) > 0
              ? formatTransactionAmount(Number(amount))
              : "₹0.00"}
          </p>
          <dl className="mt-5 space-y-4 text-sm">
            <SummaryItem
              label="Recipient"
              value={selectedRecipient?.displayName ?? "Not selected"}
            />
            <SummaryItem label="Type" value={transactionType} />
            <SummaryItem
              label="Classification"
              value={
                categoryUuid === AUTO_CLASSIFY_VALUE
                  ? "Auto-classify"
                  : ([selectedCategory?.name, selectedSubcategory?.name]
                      .filter(Boolean)
                      .join(" · ") || "Uncategorized")
              }
            />
            <SummaryItem
              label="When"
              value={
                summaryTimestamp
                  ? formatTransactionDateTime(summaryTimestamp)
                  : "Invalid date"
              }
            />
            <SummaryItem label="Source" value="Manual entry" />
          </dl>
        </aside>
      </div>

      <MobileActionBar>
        <Button
          type="submit"
          className="w-full"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {createMutation.isPending ? "Creating…" : "Create Transaction"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => canLeave() && router.push("/transactions")}
        >
          Cancel
        </Button>
      </MobileActionBar>
    </form>
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
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "block min-w-0 text-sm font-medium text-foreground",
        className,
      )}
    >
      {label}
      <div className="mt-2">{children}</div>
      {error ? (
        <span className="mt-1.5 block text-sm text-destructive">{error}</span>
      ) : null}
    </label>
  );
}

function SectionHeading({
  number,
  title,
  optional = false,
}: {
  number: string;
  title: string;
  optional?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="text-[1.05rem] font-semibold text-foreground">
        {number}. {title}
      </h2>
      {optional ? (
        <span className="text-xs font-medium text-secondary-foreground">
          Optional
        </span>
      ) : null}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-border/35 pt-3 first:border-0 first:pt-0">
      <dt className="text-secondary-foreground">{label}</dt>
      <dd className="mt-1 break-words font-medium text-foreground">{value}</dd>
    </div>
  );
}

function applyServerErrors(
  error: unknown,
  setError: ReturnType<typeof useForm<TransactionCreateFormSchema>>["setError"],
) {
  if (!(error instanceof ApiClientError) || !Array.isArray(error.body?.issues))
    return;
  const fields = new Set(Object.keys(transactionCreateFormSchema.shape));
  for (const issue of error.body.issues) {
    if (
      !issue ||
      typeof issue !== "object" ||
      !("path" in issue) ||
      !("message" in issue)
    )
      continue;
    const field = Array.isArray(issue.path) ? issue.path[0] : null;
    if (
      typeof field === "string" &&
      fields.has(field) &&
      typeof issue.message === "string"
    ) {
      setError(
        field as keyof TransactionCreateFormSchema,
        { type: "server", message: issue.message },
        { shouldFocus: true },
      );
    }
  }
}
