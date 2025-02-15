"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiUrl } from "@/app/config";
import { categorySubcategoriesMap } from "@/utils/variables";
import { toast } from "sonner";
import { epochToGMT530 } from "@/utils/datetime_formatter";

type TransactionPayload = {
  account: string;
  amount: number;
  recipient: string;
  category: string;
  subcategory: string;
  remarks: string;
  reference: string;
};

export default function TransactionPage() {
  const router = useRouter();
  const { uuid } = useParams();

  const transactionUUID = Array.isArray(uuid) ? uuid[0] : uuid;

  const [formData, setFormData] = useState({
    account: "",
    amount: 0,
    recipient: "",
    category: "",
    subcategory: "",
    remarks: "",
    reference: "",
    timestamp: null,
  });

  useEffect(() => {
    if (transactionUUID) {
      const fetchTransactionData = async () => {
        try {
          const response = await fetch(
            `${apiUrl}/transaction/${transactionUUID}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem(
                  "trackcrow-token"
                )}`,
              },
            }
          );
          if (!response.ok) {
            throw new Error("Failed to fetch transaction data");
          }
          const data = await response.json();
          const transaction = data.result;
          setFormData({
            account: transaction.account,
            amount: transaction.amount,
            recipient: transaction.recipient,
            category: transaction.category,
            subcategory: transaction.subcategory,
            remarks: transaction.remarks,
            reference: transaction.reference,
            timestamp: transaction.timestamp,
          });
        } catch (error) {
          console.error("Error fetching transaction data:", error);
          toast.error("Error fetching transaction data.");
        }
      };
      fetchTransactionData();
    }
  }, [transactionUUID]);

  const handleSelectChange = (name: string, value: number | string) => {
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const updateTransaction = async (
    transactionUUID: string,
    payload: TransactionPayload
  ) => {
    try {
      const response = await fetch(`${apiUrl}/transaction/${transactionUUID}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("trackcrow-token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update the transaction");
      }

      router.push(`/transaction/${transactionUUID}`);
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Error updating transaction.");
    }
  };

  const handleGetSuggestion = async () => {
    if (transactionUUID) {
      try {
        const response = await fetch(
          `${apiUrl}/suggest/${transactionUUID}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem(
                "trackcrow-token"
              )}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch transaction data");
        }
        const data = await response.json();
        setFormData((prevState) => ({
          ...prevState,
          category: data.result.suggestedCategory || prevState.category,
        }));
        setTimeout(() => {
          setFormData((prevState) => ({
            ...prevState,
            subcategory: data.result.suggestedSubcategory || prevState.subcategory,
          }));
        }, 10);
      } catch (error) {
        console.error("Error fetching suggestion:", error);
        toast.error("Error fetching suggestion.");
      }
    }
  }

  const handleSubmit = () => {
    if (transactionUUID) {
      const payload: TransactionPayload = {
        amount: formData.amount,
        recipient: formData.recipient,
        category: formData.category,
        subcategory: formData.subcategory,
        reference: formData.reference,
        account: formData.account,
        remarks: formData.remarks,
      };
      updateTransaction(transactionUUID, payload);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Edit Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="Enter amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timestamp">Time</Label>
                    <Input
                      id="timestamp"
                      name="timestamp"
                      value={
                        formData.timestamp
                          ? epochToGMT530(formData.timestamp)
                          : ""
                      }
                      readOnly
                      placeholder="Time"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      name="category"
                      value={formData.category}
                      onValueChange={(value) =>
                        handleSelectChange("category", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(categorySubcategoriesMap).map(
                          (category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account">Account</Label>
                    <Input
                      id="account"
                      name="account"
                      value={formData.account}
                      onChange={(e) =>
                        setFormData({ ...formData, account: e.target.value })
                      }
                      placeholder="Enter account"
                    />
                  </div>
                </div>
                {/* Right Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient *</Label>
                    <Input
                      id="recipient"
                      name="recipient"
                      value={formData.recipient}
                      onChange={(e) =>
                        setFormData({ ...formData, recipient: e.target.value })
                      }
                      placeholder="Enter recipient"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference">Reference</Label>
                    <Input
                      id="reference"
                      name="reference"
                      value={formData.reference}
                      onChange={(e) =>
                        setFormData({ ...formData, reference: e.target.value })
                      }
                      placeholder="Enter reference (optional)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subcategory">Subcategory</Label>
                    <Select
                      name="subcategory"
                      value={formData.subcategory}
                      onValueChange={(value) =>
                        handleSelectChange("subcategory", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.category &&
                          categorySubcategoriesMap[formData.category].map(
                            (subcategory) => (
                              <SelectItem key={subcategory} value={subcategory}>
                                {subcategory}
                              </SelectItem>
                            )
                          )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea
                      id="remarks"
                      name="remarks"
                      value={formData.remarks}
                      onChange={(e) =>
                        setFormData({ ...formData, remarks: e.target.value })
                      }
                      placeholder="Remarks (optional)"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <Button
                  variant="secondary"
                  type="button"
                  className="bg-gray-100 text-black hover:bg-gray-200"
                  onClick={handleGetSuggestion}
                >
                Get Suggestion
                </Button>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  className="bg-black text-white hover:bg-gray-800"
                  onClick={handleSubmit}
                >
                  Submit
                </Button>
                <Button
                  type="button"
                  className="bg-black text-white hover:bg-gray-800"
                  onClick={() => router.push(`/dashboard`)}
                >
                  Go Back
                </Button>
              </div>
            </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
