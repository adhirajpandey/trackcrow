"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addTransaction } from "./actions";
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
import { formatDateTime } from "@/common/utils";
import { Toaster, toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CategoryWithSubs = {
  id: number;
  name: string;
  Subcategory: { id: number; name: string; categoryId: number }[];
};

const formSchema = z.object({
  amount: z.coerce.number().positive(),
  recipient: z.string().min(1),
  recipient_name: z.string().optional(),
  // Use IDs from user's categories
  categoryId: z.coerce.number().int().positive(),
  subcategoryId: z.coerce.number().int().positive().optional(),
  type: z.enum(["UPI", "CARD", "CASH", "NETBANKING", "OTHER"]).default("UPI"),
  remarks: z.string().optional(),
  timestamp: z.coerce.date(),
  // UI toggle: when true, keep recipient_name same as recipient
  same_as_recipient: z.boolean().default(true),
});

export function AddTransactionForm({
  categories,
}: {
  categories: CategoryWithSubs[];
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: undefined,
      recipient: "",
      recipient_name: "",
      categoryId: undefined as unknown as number, // managed via Select
      subcategoryId: undefined,
      type: "UPI",
      remarks: "",
      timestamp: new Date(),
      same_as_recipient: true,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        formData.append(key, value instanceof Date ? value.toISOString() : value.toString());
      }
    });

    const result = await addTransaction(formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.message);
      form.reset();
    }
  }

  return (
    <>
      <Toaster />
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
                  name="recipient"
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
                            if (form.getValues("same_as_recipient")) {
                              form.setValue("recipient_name", e.target.value, {
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
                  name="recipient_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient Name</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <Input
                            className="flex-1"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={form.watch("same_as_recipient")}
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
                    const selectedCatId = form.watch("categoryId");
                    const selectedCat = categories.find((c) => c.id === selectedCatId);
                    const subs = selectedCat?.Subcategory ?? [];
                    return (
                      <FormItem>
                        <FormLabel>Subcategory</FormLabel>
                        <FormControl>
                          <Select
                            value={String(field.value ?? "")}
                            onValueChange={(val) => field.onChange(Number(val))}
                            disabled={!selectedCatId || subs.length === 0}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={
                                !selectedCatId
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
