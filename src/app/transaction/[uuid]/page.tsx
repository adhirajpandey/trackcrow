"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiUrl } from "@/app/config";
import { toast } from "sonner";
import { epochToGMT530 } from "@/utils/datetime_formatter";

export default function TransactionPage() {
  const router = useRouter();
  const { uuid } = useParams();

  // Form data state
  const [formData, setFormData] = useState({
    amount: "",
    recipient: "",
    category: "",
    subcategory: "",
    remarks: "",
    reference: "",
    timestamp: null,
    account: "",
  });

  // Track if fields are read-only
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Fetch transaction data based on UUID
  useEffect(() => {
    if (uuid) {
      const fetchTransactionData = async () => {
        try {
          const response = await fetch(`${apiUrl}/transaction/${uuid}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem(
                "trackcrow-token"
              )}`,
            },
          });
          if (!response.ok) {
            throw new Error("Failed to fetch transaction data");
          }
          const data = await response.json();
          const transaction = data.result;
          setFormData({
            amount: transaction.amount,
            recipient: transaction.recipient,
            category: transaction.category,
            subcategory: transaction.subcategory,
            remarks: transaction.remarks,
            reference: transaction.reference,
            timestamp: transaction.timestamp,
            account: transaction.account,
          });
          setIsReadOnly(true); // Set fields to read-only after data fetch
        } catch (error) {
          console.error("Error fetching transaction data:", error);
          toast.error("Error fetching transaction data.");
        }
      };
      fetchTransactionData();
    }
  }, [uuid]);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
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
                      defaultValue={formData.amount}
                      readOnly={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timestamp">Time</Label>
                    <Input
                      id="timestamp"
                      name="timestamp"
                      defaultValue={
                        formData.timestamp
                          ? epochToGMT530(formData.timestamp)
                          : ""
                      }
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      name="category"
                      defaultValue={formData.category}
                      readOnly={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account">Account</Label>
                    <Input
                      id="account"
                      name="account"
                      defaultValue={formData.account}
                      readOnly={isReadOnly}
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
                      defaultValue={formData.recipient}
                      readOnly={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference">Reference</Label>
                    <Input
                      id="reference"
                      name="reference"
                      defaultValue={formData.reference}
                      readOnly={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subcategory">Subcategory</Label>
                    <Input
                      id="subcategory"
                      name="subcategory"
                      defaultValue={formData.subcategory}
                      readOnly={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea
                      id="remarks"
                      name="remarks"
                      defaultValue={formData.remarks}
                      readOnly={isReadOnly}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  className="bg-black text-white hover:bg-gray-800"
                  onClick={() => router.push(`/transaction/edit/${uuid}`)}
                >
                  Edit Transaction
                </Button>
                <Button
                  type="button"
                  className="bg-black text-white hover:bg-gray-800"
                  onClick={() => router.push(`/dashboard`)}
                >
                  Go Back
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
