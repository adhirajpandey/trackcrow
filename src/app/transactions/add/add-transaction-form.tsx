"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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

import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRANSACTION_TYPES, type CategoryOption } from "@/common/types";
import { createManualTransaction, getApiErrorMessage } from "@/lib/api-client";

const formSchema = z.object({
  amount: z.number().positive(),
  recipientRaw: z.string().min(1),
  recipientName: z.string().optional(),
  categoryId: z.number().int().positive(),
  subcategoryId: z.number().int().positive().optional(),
  type: z.enum(["UPI", "CARD", "CASH", "NETBANKING", "OTHER"]).default("UPI"),
  remarks: z.string().optional(),
  timestamp: z.date(),
  sameAsRecipient: z.boolean().default(true),
});

export type AddTransactionFormValues = z.infer<typeof formSchema>;

export function AddTransactionForm({
  categories,
}: {
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const form = useForm<AddTransactionFormValues, any, AddTransactionFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      amount: undefined,
      recipientRaw: "",
      recipientName: "",
      categoryId: undefined,
      subcategoryId: undefined,
      type: "UPI",
      remarks: "",
      timestamp: new Date(),
      sameAsRecipient: true,
    },
  });
  const sameAsRecipient = useWatch({
    control: form.control,
    name: "sameAsRecipient",
  });
  const selectedCategoryId = useWatch({
    control: form.control,
    name: "categoryId",
  });

  async function onSubmit(values: AddTransactionFormValues) {
    try {
      await createManualTransaction({
        amount: values.amount,
        recipientRaw: values.recipientRaw,
        recipientName: values.recipientName || null,
        categoryId: values.categoryId,
        subcategoryId: values.subcategoryId,
        type: values.type,
        remarks: values.remarks || null,
        timestamp: values.timestamp.toISOString(),
      });
      toast.success("Transaction added successfully");
      form.reset();
      router.refresh();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create transaction"));
    }
  }

  return (
    <>
      
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Amount <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          required
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            field.onChange(v === "" ? undefined : Number(v));
                          }}
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
                      <FormLabel>
                        Recipient <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          required
                          value={field.value ?? ""}
                          onChange={(e) => {
                            if (sameAsRecipient) {
                              form.setValue("recipientName", e.target.value, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                            }
                            field.onChange(e);
                          }}
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
                      <FormLabel>Recipient Name</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <Input
                            className="flex-1"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={sameAsRecipient}
                          />
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={sameAsRecipient}
                              onCheckedChange={(checked) => {
                                form.setValue("sameAsRecipient", checked);
                                if (checked) {
                                  const currentRecipient = form.getValues("recipientRaw") || "";
                                  form.setValue("recipientName", currentRecipient, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  });
                                }
                              }}
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
                      <FormLabel>
                        Category <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={String(field.value ?? "")}
                          onValueChange={(val) => {
                            const num = Number(val);
                            field.onChange(num);
                            // Reset subcategory when category changes
                            form.setValue("subcategoryId", undefined, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }}
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
                  render={({ field }) => {
                    const selectedCat = categories.find((c) => c.id === selectedCategoryId);
                    const subs = selectedCat?.subcategories ?? [];
                    return (
                      <FormItem>
                        <FormLabel>Subcategory</FormLabel>
                        <FormControl>
                          <Select
                            value={String(field.value ?? "")}
                            onValueChange={(val) => field.onChange(Number(val))}
                            disabled={!selectedCategoryId || subs.length === 0}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={
                                !selectedCategoryId
                                  ? "Select a category first"
                                  : subs.length === 0
                                  ? "No subcategories"
                                  : "Select a subcategory (optional)"
                              } />
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
                    );
                  }}
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
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                          <SelectContent>
                            {TRANSACTION_TYPES.map((t) => (
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
                        <Input value={field.value ?? ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit">Add Transaction</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
