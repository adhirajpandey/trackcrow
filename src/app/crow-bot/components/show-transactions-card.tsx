"use client";
import React from "react";

type Transaction = {
  id: number;
  amount: number;
  category: string;
  date: string;
  type: string;
};

type ShowTransactionsProps = {
  transactions: Transaction[];
};

export const ShowTransactionsCard = ({
  transactions = [],
}: ShowTransactionsProps) => {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const openTransactionsPage = () => {
    const transactionData = encodeURIComponent(
      JSON.stringify(safeTransactions)
    );
    const newTab = window.open(
      `/reports/transactions?data=${transactionData}`,
      "_blank"
    );
    if (!newTab) alert("Please allow popups to view transactions");
  };

  return (
    <div
      onClick={openTransactionsPage}
      className="w-full max-w-2xl mx-auto rounded-xl border border-border px-8 py-6 shadow-md flex flex-col space-y-3 cursor-pointer hover:bg-gray-800 transition-colors"
    >
      <h2 className="text-base font-semibold text-gray-200">
        💳 Transactions Found
      </h2>
      <p className="text-gray-400 text-sm">
        View detailed analytics and insights.
      </p>
      <p className="text-xs text-gray-500 italic">Tap to open in a new tab →</p>
    </div>
  );
};
