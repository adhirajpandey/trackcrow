"use client";

import React from "react";

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
import { Toaster, toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
//

type CategoryWithSubs = {
  id: number;
  name: string;
  Subcategory: { id: number; name: string; categoryId: number }[];
};

const formSchema = z.object({
  amount: z.coerce.number().positive(),
  recipient: z.string().min(1),
  recipient_name: z.string().optional(),
  // Category can be missing for uncategorized transactions
  categoryId: z
    .preprocess(
      (v) => (v === "" || v === undefined ? undefined : v),
      z.coerce.number().int().positive()
    )
    .optional(),
  subcategoryId: z
    .preprocess(
      (v) => (v === "" || v === undefined ? undefined : v),
      z.coerce.number().int().positive()
    )
    .optional(),
  type: z.enum(["UPI", "CARD", "CASH", "NETBANKING", "OTHER"]).default("UPI"),
  remarks: z.string().optional(),
  same_as_recipient: z.boolean().default(true),
  timestamp: z.coerce.date(),
});

export type ViewTransactionDefaults = z.infer<typeof formSchema>;

export function ViewTransactionForm({
  categories,
  defaults,
  transactionId,
}: {
  categories: CategoryWithSubs[];
  defaults: ViewTransactionDefaults;
  transactionId: number;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const form = useForm<ViewTransactionDefaults>({
    resolver: zodResolver(formSchema),
    defaultValues: defaults,
    mode: "onChange",
  });

  const selectedCatId = form.watch("categoryId");
  const selectedCat = categories.find((c) => c.id === selectedCatId);
  const subs = selectedCat?.Subcategory ?? [];

  async function onSubmit(values: ViewTransactionDefaults) {
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
  }

  return (
    <>
      <Toaster />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction Details</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm text-muted-foreground">Edit</span>
              <Switch checked={isEditing} onCheckedChange={setIsEditing} />
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
                          readOnly={!isEditing || form.watch("same_as_recipient")}
                          disabled={!isEditing || form.watch("same_as_recipient")}
                        />
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={form.watch("same_as_recipient")}
                            onCheckedChange={(checked) => {
                              form.setValue("same_as_recipient", checked);
                              if (checked) {
                                const currentRecipient = form.getValues("recipient") || "";
                                form.setValue("recipient_name", currentRecipient, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                });
                              }
                            }}
                            disabled={!isEditing}
                          />
                          <span className="text-xs md:text-sm text-muted-foreground">Same as recipient</span>
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
                          const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
                          const yyyy = get("year");
                          const mm = get("month");
                          const dd = get("day");
                          const HH = get("hour");
                          const MM = get("minute");
                          istInput = yyyy && mm && dd && HH && MM ? `${yyyy}-${mm}-${dd}T${HH}:${MM}` : "";
                        }
                        return (
                          <Input
                            type="datetime-local"
                            value={istInput}
                            onChange={(e) => {
                              const v = e.target.value;
                              field.onChange(v ? new Date(`${v}:00.000+05:30`) : undefined);
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
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Select
                        value={String(field.value ?? "")}
                        onValueChange={(val) => {
                          const num = Number(val);
                          field.onChange(num);
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
                        value={String(field.value ?? "")}
                        onValueChange={(val) => field.onChange(Number(val))}
                        disabled={!isEditing || !selectedCatId || subs.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={!selectedCatId ? "Select a category first" : subs.length === 0 ? "No subcategories" : "Select a subcategory (optional)"} />
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
                          {(["UPI", "CARD", "CASH", "NETBANKING", "OTHER"] as const).map((t) => (
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
            {isEditing ? (
              <Button type="submit">Save</Button>
            ) : null}
          </form>
        </Form>
      </CardContent>
    </Card>
    </>
  );
}
