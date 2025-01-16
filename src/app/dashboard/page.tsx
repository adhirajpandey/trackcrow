"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { epochToGMT530 } from "@/utils/datetime_formatter";
import { numberToINR } from "@/utils/currency-formatter";
import { apiUrl } from "@/app/config";
import {
  TrashButton,
  EditButton,
  ViewButton,
} from "@/components/ui/custom-button";
import { DateRange } from "react-day-picker";
import { DateRangePickerMenu } from "@/components/ui/date-range-picker";
import { convertDateRangeToEpoch } from "@/utils/datetime_formatter";

type Transaction = {
  uuid: string;
  timestamp: number;
  amount: number;
  recipient: string;
  category: string | null;
  account: string;
};

type DashboardData = {
  totalTransactionsCount: number;
  untrackedTransactionsCount: number;
  totalTrackedAmount: number;
  recentTransactions: Transaction[];
  categoricalTotal: {
    essentialsTotal: number;
    foodTotal: number;
    shoppingTotal: number;
    transportTotal: number;
  };
};

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/dashboard`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("trackcrow-token")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      const res = await response.json();
      const data = res.result;
      setDashboard(data);
    } catch (err) {
      setError(
        "An error occurred while fetching transactions. Please try again later."
      );
      console.error("Error fetching transactions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTransaction = async (transactionUUID: string) => {
    try {
      // Make an API call to delete the transaction
      const response = await fetch(`${apiUrl}/transaction/${transactionUUID}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("trackcrow-token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete the transaction");
      }

      // Refresh dashboard data after successful deletion
      fetchDashboardData();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    const epochRange = convertDateRangeToEpoch(dateRange);
    console.log("Selected Date Range:", epochRange);
  };

  if (!dashboard) {
    return null;
  }

  const totalTransactions = dashboard.totalTransactionsCount;
  const untrackedTransactions = dashboard.untrackedTransactionsCount;
  const totalAmount = dashboard.totalTrackedAmount;
  const recentTransactions = dashboard.recentTransactions;
  const essentialsTotal = dashboard.categoricalTotal.essentialsTotal;
  const foodTotal = dashboard.categoricalTotal.foodTotal;
  const shoppingTotal = dashboard.categoricalTotal.shoppingTotal;
  const transportTotal = dashboard.categoricalTotal.transportTotal;

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-row items-center justify-between text-3xl font-bold mb-6 w-full">
        <span>Dashboard</span>
        <span className="flex items-center ml-auto">
          <DateRangePickerMenu onDateRangeChange={handleDateRangeChange} />
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Amount Tracked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{numberToINR(totalAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Untracked Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{untrackedTransactions}</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mb-4">Recent Transactions</h2>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Account</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentTransactions.map((transaction) => (
              <TableRow key={transaction.uuid}>
                <TableCell>{epochToGMT530(transaction.timestamp)}</TableCell>
                <TableCell>{transaction.recipient}</TableCell>
                <TableCell>{numberToINR(transaction.amount)}</TableCell>
                <TableCell>{transaction.category || ""}</TableCell>
                <TableCell>{transaction.account}</TableCell>
                <Dialog>
                  <TableCell className="text-center">
                    <Link href={`/transaction/${transaction.uuid}`} passHref>
                      <ViewButton></ViewButton>
                    </Link>
                    <Link
                      href={`/transaction/edit/${transaction.uuid}`}
                      passHref
                    >
                      <EditButton></EditButton>
                    </Link>
                    <DialogTrigger asChild>
                      <TrashButton
                        onClick={() => setSelectedTransaction(transaction.uuid)}
                      ></TrashButton>
                    </DialogTrigger>
                  </TableCell>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Are you absolutely sure?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently
                        delete your transaction and remove your data from our
                        servers.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-start">
                      <DialogClose asChild>
                        <Button
                          type="button"
                          className="bg-black text-white hover:bg-gray-800"
                        >
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                        type="submit"
                        className="bg-red-500 text-white hover:bg-red-600"
                        onClick={() => {
                          if (selectedTransaction) {
                            deleteTransaction(selectedTransaction);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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

      <h2 className="text-2xl font-bold mb-4">Categorical Spends</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* TODO: Make this more Dynamic Later */}
        <Link href="/dashboard/Essentials">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Essentials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {numberToINR(essentialsTotal)}
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/Food">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Food</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{numberToINR(foodTotal)}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/Shopping">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shopping</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {numberToINR(shoppingTotal)}
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/Transport">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transport</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {numberToINR(transportTotal)}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
