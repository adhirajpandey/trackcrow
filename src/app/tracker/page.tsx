"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

import { TransactionTracker } from "@/components/transaction-tracker-c";
import { apiUrl } from "@/app/config";

type TrackerData = {
  untrackedTransactionsCategoricalCount: {
    [key: string]: number;
  };
};

export default function TrackerPage() {
  const [trackerData, setTrackerData] = useState<TrackerData>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrackerData();
  }, []);

  const fetchTrackerData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/tracker`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("trackcrow-token")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch tracker data");
      }
      const res = await response.json();
      const data = res.result;
      setTrackerData(data);
    } catch (err) {
      setError(
        "An error occurred while fetching transactions. Please try again later."
      );
      console.error("Error fetching transactions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!trackerData) {
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

  const { untrackedTransactionsCategoricalCount } = trackerData;

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">
          Categorical Untracked Transactions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {Object.keys(untrackedTransactionsCategoricalCount).map(
            (category: string) => (
              <Link href={`/tracker/${category}`} key={category}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {untrackedTransactionsCategoricalCount[category]}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          )}
        </div>
        <TransactionTracker />
      </main>
    </div>
  );
}
