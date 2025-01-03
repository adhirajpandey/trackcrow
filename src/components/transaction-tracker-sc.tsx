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
import { epochToGMT530 } from "../utils/datetime_formatter";
import { apiUrl } from "../app/config";

type Transaction = {
  uuid: string;
  id: number;
  timestamp: number;
  recipient: string;
  amount: number;
  account: string;
  category?: string;
  subcategory?: string;
  location?: string;
};

// const categories = ["Food", "Transport", "Essentials", "Shopping"];

const categorySubcategoriesMap: { [key: string]: string[] } = {
  Food: ["Breakfast", "Lunch", "Dinner", "Snacks"],
  Transport: ["Cab", "Auto", "Bike", "Others"],
  Essentials: ["Household", "Groceries", "Utilities", "Others"],
  Shopping: ["Apparel", "Gadgets", "Gifts", "Others"],
};

export function TransactionTracker() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>(
    []
  );
  const [seletedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const category = window.location.pathname.split("/").pop() || "";
  const subcategories = categorySubcategoriesMap[category] || [];

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/transactions/${category}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("trackcrow-token")}`,
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
    if (!seletedSubcategory) {
      alert("Please select a subcategory");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/transactions/${category}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("trackcrow-token")}`,
        },
        body: JSON.stringify({
          txnIds: selectedTransactions,
          subcategory: seletedSubcategory,
        }),
      });
      console.log(
        JSON.stringify({
          transactionIds: selectedTransactions,
          category: seletedSubcategory,
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
      setSelectedSubcategory("");
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
        <h2 className="text-2xl font-bold">Your Categorised Transactions</h2>
        <div className="flex items-center space-x-2">
          <Select
            value={seletedSubcategory}
            onValueChange={setSelectedSubcategory}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select subcategory" />
            </SelectTrigger>
            <SelectContent>
              {subcategories.map((subcategory) => (
                <SelectItem key={subcategory} value={subcategory}>
                  {subcategory}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleCategorize}
            disabled={
              selectedTransactions.length === 0 ||
              !seletedSubcategory ||
              isLoading
            }
            className="bg-black text-white hover:bg-gray-800"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Subcategorize"
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
              <TableHead>Account</TableHead>
              <TableHead>Subcategory</TableHead>
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
                <TableCell>{epochToGMT530(transaction.timestamp)}</TableCell>
                <TableCell>{transaction.recipient}</TableCell>
                <TableCell>Rs.{transaction.amount}</TableCell>
                <TableCell>{transaction.account}</TableCell>
                <TableCell>{transaction.subcategory}</TableCell>
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
