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
import { apiUrl } from "@/app/config";
import { epochToGMT530 } from "@/utils/datetime_formatter";
import { numberToINR } from "@/utils/currency-formatter";
import { DateRangePickerMenu } from "@/components/ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { convertDateRangeToEpoch } from "@/utils/datetime_formatter";

type Transaction = {
  uuid: string;
  id: number;
  timestamp: number;
  recipient: string;
  amount: number;
  account: string;
  category: string;
  location?: string;
  subcategory?: string;
};

type CategorySubCategories = {
  [category: string]: string[];
};

export default function Transactions() {
  const [transactionsData, setTransactionsData] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(
    null
  );
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(
    null
  );
  const [selectedDateRange, setSelectedDateRange] = useState<
    DateRange | undefined
  >(undefined);
  const [recipients, setRecipients] = useState<string[]>([]);

  const categorySubCategories: CategorySubCategories = {
    Food: ["Breakfast", "Lunch", "Dinner", "Snacks"],
    Transport: ["Cab", "Auto", "Bike", "Others"],
    Essentials: ["Household", "Groceries", "Utilities", "Others"],
    Shopping: ["Apparel", "Gadgets", "Gifts", "Others"],
  };

  useEffect(() => {
    fetchTransactionsData();
    getUniqueRecipients();
  }, []);

  const getUniqueRecipients = async () => {
    const response = await fetch(`${apiUrl}/transactions`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("trackcrow-token")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to recipient list");
    }

    const res = await response.json();
    const data: Array<Transaction> = res.result.txns || [];

    const uniqueRecipients: string[] = [
      ...new Set(data.map((txn) => txn.recipient as string)),
    ];
    setRecipients(uniqueRecipients);
  };

  const fetchTransactionsData = async () => {
    try {
      const queryParams = new URLSearchParams();

      if (selectedDateRange) {
        const epochRange = convertDateRangeToEpoch(selectedDateRange);
        queryParams.append("from", epochRange.from?.toString() ?? "");
        queryParams.append("to", epochRange.to?.toString() ?? "");
      }

      if (selectedRecipient) queryParams.append("recipient", selectedRecipient);
      if (selectedCategory) queryParams.append("category", selectedCategory);
      if (selectedSubCategory)
        queryParams.append("subcategory", selectedSubCategory);

      const response = await fetch(
        `${apiUrl}/transactions?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("trackcrow-token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const res = await response.json();
      const data = res.result.txns || [];
      setTransactionsData(data);
    } catch (err) {
      setError(
        "An error occurred while fetching transactions. Please try again later."
      );
      console.error("Error fetching transactions:", err);
    }
  };

  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    setSelectedDateRange(dateRange);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  const handleSubCategoryChange = (value: string) => {
    setSelectedSubCategory(value);
  };

  const handleRecipientChange = (value: string) => {
    setSelectedRecipient(value);
  };

  useEffect(() => {
    if (
      selectedDateRange ||
      selectedRecipient ||
      selectedCategory ||
      selectedSubCategory
    ) {
      fetchTransactionsData();
    }
  }, [
    selectedDateRange,
    selectedRecipient,
    selectedCategory,
    selectedSubCategory,
  ]);

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex flex-row items-center justify-between text-3xl font-bold mb-4 w-full">
        <span>Transactions</span>
        <span className="flex items-center ml-auto">
          <DateRangePickerMenu onChange={handleDateRangeChange} />
          <Select onValueChange={handleRecipientChange}>
            <SelectTrigger className="w-full md:w-[200px] mx-1 ">
              <SelectValue placeholder="Recipient">
                {selectedRecipient || "Recipient"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {recipients.map((recipient, index) => (
                <SelectItem key={index} value={recipient}>
                  {recipient}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full md:w-[200px] mr-1 ">
              <SelectValue placeholder="Category">
                {selectedCategory || "Category"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Food">Food</SelectItem>
              <SelectItem value="Transport">Transport</SelectItem>
              <SelectItem value="Essentials">Essentials</SelectItem>
              <SelectItem value="Shopping">Shopping</SelectItem>
            </SelectContent>
          </Select>
          {selectedCategory && (
            <Select onValueChange={handleSubCategoryChange}>
              <SelectTrigger className="w-full md:w-[200px] mr-1 ">
                <SelectValue placeholder="Subcategory">
                  {selectedSubCategory || "Subcategory"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categorySubCategories[selectedCategory]?.map((subCategory) => (
                  <SelectItem key={subCategory} value={subCategory}>
                    {subCategory}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </span>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Subcategory</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactionsData.map((transaction) => (
              <TableRow key={transaction.uuid}>
                <TableCell>{epochToGMT530(transaction.timestamp)}</TableCell>
                <TableCell>{transaction.recipient}</TableCell>
                <TableCell>{numberToINR(transaction.amount)}</TableCell>
                <TableCell>{transaction.account}</TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell>{transaction.subcategory}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
