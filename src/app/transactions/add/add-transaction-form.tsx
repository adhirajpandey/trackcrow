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
import { Toaster, toast } from "sonner";

const formSchema = z.object({
  amount: z.coerce.number().positive(),
  recipient: z.string().min(1),
  recipient_name: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  remarks: z.string().optional(),
  timestamp: z.coerce.date(),
});

export function AddTransactionForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: undefined,
      recipient: "",
      recipient_name: "",
      category: "",
      subcategory: "",
      remarks: "",
      timestamp: new Date(),
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value) {
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
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
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
                        <Input {...field} />
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subcategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategory</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input
                          type="datetime-local"
                          value={
                            field.value
                              ? new Date(field.value.getTime() - field.value.getTimezoneOffset() * 60000)
                                  .toISOString()
                                  .slice(0, 16)
                              : ""
                          }
                          onChange={(e) => {
                            if (e.target.value) {
                              field.onChange(new Date(e.target.value));
                            }
                          }}
                        />
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
