"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type Transaction = {
  uuid: string;
  id: number;
  timestamp: string;
  recipient: string;
  amount: number;
  location?: string;
};

const categories = ["Food", "Transport", "Essentials", "Shopping"];

const api = "http://localhost:5000";
const authHeader =
  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiMjkwOWViOTctYTczMi00ZWY4LWIyNTEtZmVkOTllNzgwYzQxIiwiaWF0IjoxNzM0OTgzMjU2fQ.IE-68mkfj3oGRWtv0edBVqT8EI_YNSV6jPmLlohELCU";

export function TransactionTracker() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>(
    []
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${api}/transactions/untracked`, {
        headers: {
          Authorization: authHeader,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      const data = await response.json();
      setTransactions(data.result.txns);
    } catch (err) {
      setError(
        "An error occurred while fetching transactions. Please try again later."
      );
      console.error("Error fetching transactions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTransaction = (transactionId: string) => {
    setSelectedTransactions((prev) =>
      prev.includes(transactionId)
        ? prev.filter((id) => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleSelectAllTransactions = () => {
    setSelectedTransactions(
      selectedTransactions.length === transactions.length
        ? []
        : transactions.map((t) => t.uuid)
    );
  };

  const handleCategorize = async () => {
    if (!selectedCategory) {
      alert("Please select a category");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${api}/transactions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          txnIds: selectedTransactions,
          category: selectedCategory,
        }),
      });
      console.log(
        JSON.stringify({
          transactionIds: selectedTransactions,
          category: selectedCategory,
        })
      );
      console.log(response);

      if (!response.ok) {
        throw new Error("Failed to categorize transactions");
      }

      // Refresh transactions after categorization
      await fetchTransactions();
    } catch (err) {
      setError(
        "An error occurred while categorizing transactions. Please try again."
      );
      console.error("Error categorizing transactions:", err);
    } finally {
      setIsLoading(false);
      setSelectedTransactions([]);
      setSelectedCategory("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>{error}</p>
        <Button onClick={fetchTransactions} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Untracked Transactions</h2>
        <div className="flex items-center space-x-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleCategorize}
            disabled={
              selectedTransactions.length === 0 ||
              !selectedCategory ||
              isLoading
            }
            className="bg-black text-white hover:bg-gray-800"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Categorize"
            )}
          </Button>
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedTransactions.length === transactions.length}
                  onCheckedChange={handleSelectAllTransactions}
                />
              </TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.uuid}>
                <TableCell>
                  <Checkbox
                    checked={selectedTransactions.includes(transaction.uuid)}
                    onCheckedChange={() =>
                      handleSelectTransaction(transaction.uuid)
                    }
                  />
                </TableCell>
                <TableCell>{transaction.timestamp}</TableCell>
                <TableCell>{transaction.recipient}</TableCell>
                <TableCell>Rs.{transaction.amount}</TableCell>
                <TableCell>
                  {transaction.location ? (
                    <a
                      href={`https://www.google.com/maps/search/${transaction.location}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {transaction.location}
                    </a>
                  ) : (
                    ""
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
