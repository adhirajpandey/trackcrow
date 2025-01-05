"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { epochToGMT530 } from "@/utils/datetime_formatter";
import { apiUrl } from "@/app/config";

type Transaction = {
  uuid: string;
  id: number;
  timestamp: number;
  recipient: string;
  amount: number;
  account: string;
  location?: string;
  subcategory?: string;
};

type CategoricalDashboardData = {
  totalTransactionsCount: number;
  untrackedTransactionsCount: number;
  totalTrackedAmount: number;
  recentTransactions: Transaction[];
  subcategoricalTotal: {
    [key: string]: number;
  };
};

export default function CategoricalDashboard() {
  const [categoricalData, setCategoricalData] =
    useState<CategoricalDashboardData>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategoricalDashboardData();
  }, []);

  const fetchCategoricalDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const category = window.location.pathname.split("/").pop() || "";

      const response = await fetch(`${apiUrl}/dashboard/${category}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("trackcrow-token")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      const res = await response.json();
      const data = res.result;
      setCategoricalData(data);
    } catch (err) {
      setError(
        "An error occurred while fetching transactions. Please try again later."
      );
      console.error("Error fetching transactions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!categoricalData) {
    return null;
  }

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
      </div>
    );
  }

  const { subcategoricalTotal, recentTransactions } = categoricalData;

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {Object.keys(subcategoricalTotal).map((subcategory: string) => (
            <Card key={subcategory}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {subcategory}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  Rs.{subcategoricalTotal[subcategory]}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="text-2xl font-bold mb-4">Recent Transactions</h2>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Subcategory</TableHead>
                <TableHead>Account</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((transaction) => (
                <TableRow key={transaction.uuid}>
                  <TableCell>{epochToGMT530(transaction.timestamp)}</TableCell>
                  <TableCell>{transaction.recipient}</TableCell>
                  <TableCell>Rs.{transaction.amount.toString()}</TableCell>
                  <TableCell>{transaction.subcategory || ""}</TableCell>
                  <TableCell>{transaction.account}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 text-right">
          <Link href="/tracker" className="text-blue-500 hover:underline">
            View all transactions
          </Link>
        </div>
      </main>
    </div>
  );
}
