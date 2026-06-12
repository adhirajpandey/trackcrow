"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { TransactionType } from "@/generated/prisma-rewrite";
import type { CategoryOption } from "@/common/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  amount: z.number().positive(),
  recipientRaw: z.string().min(1),
  recipientName: z.string().optional(),
  categoryId: z.number().int().positive().optional(),
  subcategoryId: z.number().int().positive().optional(),
  type: z.nativeEnum(TransactionType).default(TransactionType.UPI),
  remarks: z.string().optional(),
  sameAsRecipient: z.boolean().default(true),
  timestamp: z.date(),
});

export type ViewTransactionDefaults = z.infer<typeof formSchema>;
export type ViewTransactionFormValues = ViewTransactionDefaults;

export function ViewTransactionForm({
  categories,
  defaults,
  transactionId,
  searchParams,
}: {
  categories: CategoryOption[];
  defaults: ViewTransactionFormValues;
  transactionId: number;
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const router = useRouter();
  const isEditing = React.useMemo(() => {
    return searchParams.edit === "true" ||
      (Array.isArray(searchParams.edit) && searchParams.edit.includes("true"));
  }, [searchParams.edit]);

  const [pendingSuggestion, setPendingSuggestion] = React.useState<{
    suggestedCategoryName: string | null;
    suggestedSubCategoryName: string | null;
    categoryFound: CategoryOption | undefined;
  } | null>(null);

  const form = useForm<ViewTransactionFormValues, any, ViewTransactionFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: defaults,
    mode: "onChange",
  });

  const selectedCatId = form.watch("categoryId");
  const selectedCat = categories.find((category) => category.id === selectedCatId);
  const subcategories = React.useMemo(
    () => selectedCat?.subcategories ?? [],
    [selectedCat]
  );

  const makeToastMessage = React.useCallback(
    (
      suggestedCategoryName: string | null,
      suggestedSubCategoryName: string | null,
      categoryFound: CategoryOption | undefined
    ) => {
      let message = suggestedCategoryName
        ? `Category: ${suggestedCategoryName}`
        : "No category suggested.";

      if (suggestedSubCategoryName && categoryFound) {
        const subcategory = categoryFound.subcategories.find(
          (entry) => entry.name === suggestedSubCategoryName
        );
        message += subcategory
          ? `, Subcategory: ${suggestedSubCategoryName}`
          : `, Subcategory "${suggestedSubCategoryName}" not found.`;
      } else if (suggestedSubCategoryName) {
        message += ", Cannot suggest subcategory without a valid category.";
      } else {
        message += ", No subcategory suggested.";
      }

      return message;
    },
    []
  );

  useEffect(() => {
    if (!pendingSuggestion) {
      return;
    }

    const { suggestedCategoryName, suggestedSubCategoryName, categoryFound } =
      pendingSuggestion;

    if (suggestedSubCategoryName && categoryFound) {
      const subcategory = categoryFound.subcategories.find(
        (entry) => entry.name === suggestedSubCategoryName
      );
      if (subcategory) {
        form.setValue("subcategoryId", subcategory.id, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }

    toast.success(
      makeToastMessage(
        suggestedCategoryName,
        suggestedSubCategoryName,
        categoryFound
      )
    );
    setPendingSuggestion(null);
  }, [form, makeToastMessage, pendingSuggestion]);

  const toggleEditMode = React.useCallback(
    (forceValue?: boolean) => {
      const newValue = forceValue !== undefined ? forceValue : !isEditing;
      const nextSearchParams = new URLSearchParams(window.location.search);
      if (newValue) {
        nextSearchParams.set("edit", "true");
      } else {
        nextSearchParams.delete("edit");
      }
      router.replace(`${window.location.pathname}?${nextSearchParams.toString()}`);
      toast.success(newValue ? "Edit mode enabled" : "Edit mode disabled");
    },
    [isEditing, router]
  );

  const handleGetSuggestion = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}/suggest`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { suggestedCategory, suggestedSubCategory } = await response.json();

      let categoryFound: CategoryOption | undefined;
      let finalSuggestedCategoryName: string | null = null;

      if (suggestedCategory) {
        categoryFound = categories.find((category) => category.name === suggestedCategory);
        if (categoryFound) {
          form.setValue("categoryId", categoryFound.id, {
            shouldValidate: true,
            shouldDirty: true,
          });
          finalSuggestedCategoryName = suggestedCategory;
        } else {
          form.setValue("categoryId", undefined, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      } else {
        form.setValue("categoryId", undefined, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }

      setPendingSuggestion({
        suggestedCategoryName: finalSuggestedCategoryName,
        suggestedSubCategoryName: suggestedSubCategory,
        categoryFound,
      });
    } catch (error: any) {
      toast.error(
        `Failed to get suggestions: ${error?.message || "Unknown error"}`
      );
    }
  }, [categories, form, transactionId]);

  const onSubmit = React.useCallback(
    async (values: ViewTransactionFormValues) => {
      const formData = new FormData();
      const entries: [string, string | number | Date | null | undefined][] = [
        ["id", transactionId],
        ["amount", values.amount],
        ["recipientRaw", values.recipientRaw],
        ["recipientName", values.recipientName ?? ""],
        ["timestamp", values.timestamp],
        ["categoryId", values.categoryId],
        ["subcategoryId", values.subcategoryId],
        ["type", values.type],
        ["remarks", values.remarks ?? ""],
      ];

      for (const [key, value] of entries) {
        if (key === "recipientName" || key === "remarks") {
          formData.append(
            key,
            value instanceof Date ? value.toISOString() : String(value)
          );
          continue;
        }

        if (value === undefined || value === null || value === "") {
          continue;
        }

        formData.append(
          key,
          value instanceof Date ? value.toISOString() : String(value)
        );
      }

      const { updateTransaction } = await import("./actions");
      const result = await updateTransaction(formData);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Saved");
      const nextSearchParams = new URLSearchParams(window.location.search);
      nextSearchParams.delete("edit");
      router.replace(`${window.location.pathname}?${nextSearchParams.toString()}`);
    },
    [router, transactionId]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      if (isInputField) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "e") {
        event.preventDefault();
        toggleEditMode();
      }
      if (key === "g" && isEditing) {
        event.preventDefault();
        handleGetSuggestion();
      }
      if (key === "s" && isEditing) {
        event.preventDefault();
        form.handleSubmit(onSubmit)();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [form, handleGetSuggestion, isEditing, onSubmit, toggleEditMode]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transaction Details</CardTitle>
          <div className="flex items-center space-x-2">
            <Switch
              id="edit-mode"
              checked={isEditing}
              onCheckedChange={(checked) => toggleEditMode(checked)}
            />
            <label
              htmlFor="edit-mode"
              className="text-sm font-medium leading-none"
            >
              Edit
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
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
                        onChange={(event) => {
                          const value = event.target.value;
                          field.onChange(value === "" ? undefined : Number(value));
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
                name="recipientRaw"
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
                name="recipientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient name</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-3">
                        <Input
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          readOnly={!isEditing || form.watch("sameAsRecipient")}
                          disabled={!isEditing || form.watch("sameAsRecipient")}
                        />
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={form.watch("sameAsRecipient")}
                            onCheckedChange={(checked) => {
                              form.setValue("sameAsRecipient", checked);
                              if (checked) {
                                form.setValue(
                                  "recipientName",
                                  form.getValues("recipientRaw") || "",
                                  {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  }
                                );
                              }
                            }}
                            disabled={!isEditing}
                          />
                          <span className="text-xs text-muted-foreground md:text-sm">
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
                        const value = field.value as Date | undefined;
                        let inputValue = "";
                        if (value) {
                          const parts = new Intl.DateTimeFormat("en-GB", {
                            timeZone: "Asia/Kolkata",
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          }).formatToParts(value);
                          const get = (type: string) =>
                            parts.find((part) => part.type === type)?.value ?? "";
                          const yyyy = get("year");
                          const mm = get("month");
                          const dd = get("day");
                          const hh = get("hour");
                          const min = get("minute");
                          inputValue =
                            yyyy && mm && dd && hh && min
                              ? `${yyyy}-${mm}-${dd}T${hh}:${min}`
                              : "";
                        }

                        return (
                          <Input
                            type="datetime-local"
                            value={inputValue}
                            onChange={(event) => {
                              const value = event.target.value;
                              field.onChange(
                                value ? new Date(`${value}:00.000+05:30`) : undefined
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
                        value={
                          field.value === undefined || field.value === null
                            ? ""
                            : String(field.value)
                        }
                        onValueChange={(value) => {
                          field.onChange(value === "" ? undefined : Number(value));
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
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={String(category.id)}>
                              {category.name}
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
                        value={
                          field.value === undefined || field.value === null
                            ? ""
                            : String(field.value)
                        }
                        onValueChange={(value) =>
                          field.onChange(value === "" ? undefined : Number(value))
                        }
                        disabled={!isEditing || !selectedCatId || subcategories.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              !selectedCatId
                                ? "Select a category first"
                                : subcategories.length === 0
                                  ? "No subcategories"
                                  : "Select a subcategory (optional)"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {subcategories.map((subcategory) => (
                            <SelectItem
                              key={subcategory.id}
                              value={String(subcategory.id)}
                            >
                              {subcategory.name}
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
                        value={field.value ?? TransactionType.UPI}
                        onValueChange={(value) => field.onChange(value)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(TransactionType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
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
}
