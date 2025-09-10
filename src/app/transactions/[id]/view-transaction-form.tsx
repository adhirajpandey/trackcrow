"use client";

import React, { useEffect } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionType } from "../../../generated/prisma";
import { useRouter } from "next/navigation";

type CategoryWithSubs = {
  id: number;
  name: string;
  Subcategory: { id: number; name: string; categoryId: number }[];
};

const formSchema = z.object({
  amount: z.number().positive(),
  recipient: z.string().min(1),
  recipient_name: z.string().optional(),
  // Category can be missing for uncategorized transactions
  categoryId: z.number().int().positive().optional(),
  subcategoryId: z.number().int().positive().optional(),
  type: z.nativeEnum(TransactionType).default(TransactionType.UPI),
  remarks: z.string().optional(),
  same_as_recipient: z.boolean().default(true),
  timestamp: z.date(),
});

export type ViewTransactionDefaults = z.infer<typeof formSchema>;

export type ViewTransactionFormValues = {
  amount: number;
  recipient: string;
  recipient_name?: string;
  categoryId?: number;
  subcategoryId?: number;
  type: TransactionType;
  remarks?: string;
  same_as_recipient: boolean;
  timestamp: Date;
};

export function ViewTransactionForm({
  categories,
  defaults,
  transactionId,
  searchParams,
}: {
  categories: CategoryWithSubs[];
  defaults: ViewTransactionFormValues;
  transactionId: number;
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = React.useState(
    searchParams.edit === "true" ||
      (Array.isArray(searchParams.edit) && searchParams.edit.includes("true"))
  );
  const [pendingSuggestion, setPendingSuggestion] = React.useState<{ suggestedCategoryName: string | null; suggestedSubCategoryName: string | null; categoryFound: CategoryWithSubs | undefined } | null>(null);
  const form = useForm<
    ViewTransactionFormValues,
    any,
    ViewTransactionFormValues
  >({
    resolver: zodResolver(formSchema) as any,
    defaultValues: defaults,
    mode: "onChange",
  });

  const selectedCatId = form.watch("categoryId");
  const selectedCat = categories.find((c) => c.id === selectedCatId);
  const subs = React.useMemo(() => selectedCat?.Subcategory ?? [], [selectedCat]);

  const makeToastMessage = React.useCallback((
    suggestedCategoryName: string | null,
    suggestedSubCategoryName: string | null,
    categoryFound: CategoryWithSubs | undefined,
    subs: CategoryWithSubs['Subcategory']
  ): string => {
    let toastMessage = "";

    if (suggestedCategoryName) {
      toastMessage += `Category: ${suggestedCategoryName}`;
    } else {
      toastMessage += "No category suggested.";
    }

    if (suggestedSubCategoryName && categoryFound) {
      const subcategory = subs.find(s => s.name === suggestedSubCategoryName);
      if (subcategory) {
        if (toastMessage) toastMessage += ", ";
        toastMessage += `Subcategory: ${suggestedSubCategoryName}`;
      } else {
        if (toastMessage) toastMessage += ", ";
        toastMessage += `Subcategory \"${suggestedSubCategoryName}\" not found.`;
      }
    } else if (suggestedSubCategoryName && !categoryFound) {
      if (toastMessage) toastMessage += ", ";
      toastMessage += "Cannot suggest subcategory without a valid category.";
    } else {
      if (toastMessage) toastMessage += ", ";
      toastMessage += "No subcategory suggested.";
    }
    return toastMessage;
  }, [subs]);

  useEffect(() => {
    if (pendingSuggestion) {
      const { suggestedCategoryName, suggestedSubCategoryName, categoryFound } = pendingSuggestion;

      // Set subcategory if applicable
      if (suggestedSubCategoryName && categoryFound) {
        const subcategory = categoryFound.Subcategory.find(s => s.name === suggestedSubCategoryName);
        if (subcategory) {
          form.setValue("subcategoryId", subcategory.id, { shouldValidate: true, shouldDirty: true });
        }
      }

      const toastMessage = makeToastMessage(suggestedCategoryName, suggestedSubCategoryName, categoryFound, subs);
      if (toastMessage) {
        toast.success(toastMessage);
      }

      setPendingSuggestion(null); // Clear the pending suggestion
    }
  }, [pendingSuggestion, categories, form, subs, makeToastMessage]);

  async function handleGetSuggestion() {
    if (!transactionId) return;

    try {
      const response = await fetch(`/api/transactions/${transactionId}/suggest`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { suggestedCategory, suggestedSubCategory } = await response.json();

      let categoryFound: CategoryWithSubs | undefined;
      let finalSuggestedCategoryName: string | null = null;

      if (suggestedCategory) {
        const category = categories.find(c => c.name === suggestedCategory);
        if (category) {
          form.setValue("categoryId", category.id, { shouldValidate: true, shouldDirty: true });
          categoryFound = category;
          finalSuggestedCategoryName = suggestedCategory;
        } else {
          // Category not found in user's categories
          finalSuggestedCategoryName = null; // Explicitly set to null if not found
        }
      } else {
        // No category suggested
        form.setValue("categoryId", undefined, { shouldValidate: true, shouldDirty: true });
        finalSuggestedCategoryName = null;
      }

      setPendingSuggestion({
        suggestedCategoryName: finalSuggestedCategoryName,
        suggestedSubCategoryName: suggestedSubCategory,
        categoryFound: categoryFound
      });

    } catch (error: any) {
      console.error("Error fetching suggestions:", error);
      toast.error(`Failed to get suggestions: ${error.response?.statusText || error.message || "Unknown error"}`);
    }
  }

  async function onSubmit(values: ViewTransactionFormValues) {
    const fd = new FormData();
    fd.append("id", String(transactionId));
    // Always include recipient_name and remarks so they can be cleared
    const entries: [string, string | number | Date | null | undefined][] = [
      ["amount", values.amount],
      ["recipient", values.recipient],
      ["recipient_name", values.recipient_name ?? ""],
      ["timestamp", values.timestamp],
      ["categoryId", values.categoryId],
      ["subcategoryId", values.subcategoryId],
      ["type", values.type],
      ["remarks", values.remarks ?? ""],
    ];
    for (const [k, v] of entries) {
      if (k === "recipient_name" || k === "remarks") {
        fd.append(k, v instanceof Date ? v.toISOString() : String(v));
      } else {
        if (v === undefined || v === null || v === "") continue;
        fd.append(k, v instanceof Date ? v.toISOString() : String(v));
      }
    }
    const { updateTransaction } = await import("./actions");
    const res = await updateTransaction(fd);
    if ((res as { error: string }).error) {
      toast.error((res as { error: string }).error);
      return;
    }
    toast.success("Saved");
    setIsEditing(false);
    const newSearchParams = new URLSearchParams(window.location.search);
    newSearchParams.delete("edit");
    router.replace(`${window.location.pathname}?${newSearchParams.toString()}`);
  }

  return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction Details</CardTitle>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-mode"
                checked={isEditing}
                onCheckedChange={(checked) => {
                  setIsEditing(checked);
                  const newSearchParams = new URLSearchParams(
                    window.location.search
                  );
                  if (checked) {
                    newSearchParams.set("edit", "true");
                  } else {
                    newSearchParams.delete("edit");
                  }
                  router.replace(
                    `${window.location.pathname}?${newSearchParams.toString()}`
                  );
                }}
              />
              <label
                htmlFor="edit-mode"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Edit
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            field.onChange(v === "" ? undefined : Number(v));
                          }}
                          disabled={!isEditing}
                          readOnly={!isEditing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recipient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient</FormLabel>
                      <FormControl>
                        <Input
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          disabled={!isEditing}
                          readOnly={!isEditing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recipient_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient name</FormLabel>
                      <FormControl>
                        <div className="flex gap-3 items-center">
                          <Input
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            readOnly={
                              !isEditing || form.watch("same_as_recipient")
                            }
                            disabled={
                              !isEditing || form.watch("same_as_recipient")
                            }
                          />
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={form.watch("same_as_recipient")}
                              onCheckedChange={(checked) => {
                                form.setValue("same_as_recipient", checked);
                                if (checked) {
                                  const currentRecipient =
                                    form.getValues("recipient") || "";
                                  form.setValue(
                                    "recipient_name",
                                    currentRecipient,
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );
                                }
                              }}
                              disabled={!isEditing}
                            />
                            <span className="text-xs md:text-sm text-muted-foreground">
                              Same as recipient
                            </span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timestamp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timestamp</FormLabel>
                      <FormControl>
                        {(() => {
                          const val = field.value as Date | undefined;
                          let istInput = "";
                          if (val) {
                            const parts = new Intl.DateTimeFormat("en-GB", {
                              timeZone: "Asia/Kolkata",
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            }).formatToParts(val);
                            const get = (t: string) =>
                              parts.find((p) => p.type === t)?.value ?? "";
                            const yyyy = get("year");
                            const mm = get("month");
                            const dd = get("day");
                            const HH = get("hour");
                            const MM = get("minute");
                            istInput =
                              yyyy && mm && dd && HH && MM
                                ? `${yyyy}-${mm}-${dd}T${HH}:${MM}`
                                : "";
                          }
                          return (
                            <Input
                              type="datetime-local"
                              value={istInput}
                              onChange={(e) => {
                                const v = e.target.value;
                                field.onChange(
                                  v ? new Date(`${v}:00.000+05:30`) : undefined
                                );
                              }}
                              disabled={!isEditing}
                              readOnly={!isEditing}
                            />
                          );
                        })()}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Category</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleGetSuggestion}
                          disabled={!isEditing}
                        >
                          Get Suggestion
                        </Button>
                      </div>
                      <FormControl>
                        <Select
                          value={field.value === undefined || field.value === null ? "" : String(field.value)}
                          onValueChange={(val) => {
                            if (val === "") {
                              field.onChange(undefined);
                            } else {
                              const num = Number(val);
                              field.onChange(num);
                            }
                            form.setValue("subcategoryId", undefined, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subcategoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategory</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value === undefined || field.value === null ? "" : String(field.value)}
                          onValueChange={(val) => {
                            if (val === "") {
                              field.onChange(undefined);
                            } else {
                              field.onChange(Number(val));
                            }
                          }}
                          disabled={
                            !isEditing || !selectedCatId || subs.length === 0
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                !selectedCatId
                                  ? "Select a category first"
                                  : subs.length === 0
                                    ? "No subcategories"
                                    : "Select a subcategory (optional)"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {subs.map((s) => (
                              <SelectItem key={s.id} value={String(s.id)}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ?? "UPI"}
                          onValueChange={(val) => field.onChange(val)}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(TransactionType).map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Input
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          readOnly={!isEditing}
                          disabled={!isEditing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {isEditing ? <Button type="submit">Save</Button> : null}
            </form>
          </Form>
        </CardContent>
      </Card>
    );
};
    
