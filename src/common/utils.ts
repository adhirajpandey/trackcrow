export const numberToINR = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

// Minimal, consistent IST formatting utilities
const LOCALE = "en-GB"; // 24h clock by default
const TZ = "Asia/Kolkata"; // GMT+5:30

export function toDate(input: number | string | Date): Date {
  if (input instanceof Date) return input;
  if (typeof input === "number") {
    const ms = input > 1e12 ? input : input * 1000; // support seconds
    return new Date(ms);
  }
  return new Date(input);
}

export function formatDate(input: number | string | Date): string {
  const d = toDate(input);
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function formatDateTime(input: number | string | Date): string {
  const d = toDate(input);
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function formatMonthYear(input: number | string | Date): string {
  const d = toDate(input);
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TZ,
    month: "long",
    year: "numeric",
  }).format(d);
}

/** Returns details for the current month */
export function getCurrentMonthMeta() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { year, month, daysInMonth };
}

/** Formats day-of-month within current month into a localized label (e.g., 12 Sep 2025) */
export function formatCurrentMonthDayLabel(day: number): string {
  const { year, month } = getCurrentMonthMeta();
  const date = new Date(year, month, day);
  return formatDate(date);
}

import type { Transaction } from "@/common/schemas";

/**
 * Groups transactions into daily totals for the current month.
 * Returns compact data until the latest transaction day, or the full month if no transactions.
 */
export function getDailySpendingForCurrentMonth(transactions: Transaction[]) {
  const { year, month, daysInMonth } = getCurrentMonthMeta();
  const dailyTotals: { [day: number]: number } = {};
  for (let i = 1; i <= daysInMonth; i++) dailyTotals[i] = 0;

  let lastTxnDay = 0;
  for (const txn of transactions) {
    const date = toDate(txn.timestamp as string | Date);
    if (date.getFullYear() === year && date.getMonth() === month) {
      const day = date.getDate();
      dailyTotals[day] += Math.abs(txn.amount);
      if (day > lastTxnDay) lastTxnDay = day;
    }
  }

  const length = lastTxnDay > 0 ? lastTxnDay : daysInMonth;
  return Array.from({ length }, (_, i) => ({
    day: i + 1,
    spent: dailyTotals[i + 1] ?? 0,
  }));
}

/**
 * Returns cumulative spending by day for the current month.
 * Each entry's `cumulative` is the sum of all spending up to and including that day.
 */
export function getCumulativeDailySpendingForCurrentMonth(
  transactions: Transaction[],
) {
  const daily = getDailySpendingForCurrentMonth(transactions);
  let running = 0;
  return daily.map((d) => {
    running += d.spent;
    return { day: d.day, cumulative: running };
  });
}


export const defaultCategoriesMap = [
    { name: "Food", subcategories: ["Breakfast", "Lunch", "Dinner", "Snacks"] },
    { name: "Essentials", subcategories: ["Household", "Groceries", "Utilities", "Others"] },
    { name: "Transport", subcategories: ["Cab", "Auto", "Bike", "Others"] },
    { name: "Shopping", subcategories: ["Apparel", "Gadgets", "Gifts", "Others"] },
  ];

/**
 * Fetches all transactions for a user, ordered by latest first, and serializes
 * Prisma-specific types (Decimal, Date) into plain JSON-compatible values.
 * The `timestamp` field is provided as an ISO string for consistency across UI.
 */
// Note: server-only data helpers live in src/common/server.ts to avoid bundling prisma in client code


export type ParsedTransactionDetails = {
  amount: number | null;
  recipient: string | null;
  recipient_name?: string | null;
  type?: "UPI" | "CARD" | "CASH" | "NETBANKING" | "OTHER";
  reference?: string | null;
  account?: string | null;
};

// Heuristic parser for common banking message formats
// Extracts amount, recipient/merchant, optional recipient name, and type
// currently works only for KOTAK bank UPI messages
export function parseTransactionMessage(message: string) {
  // Regex patterns
  const amountRegex = /Sent\s+Rs\.?([\d,.]+)/i;
  const recipientRegex = /to\s+([^\s]+@[^\s]+)\s+/i;
  const refRegex = /UPI Ref\s+(\d+)/i;

  // Extract matches
  const amountMatch = message.match(amountRegex);
  const recipientMatch = message.match(recipientRegex);
  const refMatch = message.match(refRegex);

  return {
    amount: amountMatch ? amountMatch[1] : null,
    recipient_id: recipientMatch ? recipientMatch[1] : null,
    reference_number: refMatch ? refMatch[1] : null,
  };
}

export function parseMonthParam(monthParam: string) {
  let startDate: Date | undefined;
  let endDate: Date | undefined;
  let selectedMonth: { year: number; month: number } | null = null;

  if (monthParam !== 'all') {
    const [year, month] = monthParam.split('-').map(Number);
    if (!isNaN(year) && !isNaN(month) && month >= 1 && month <= 12) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 1); // First day of next month
      selectedMonth = { year, month: month - 1 };
    }
  }
  return { startDate, endDate, selectedMonth };
}

export function getCurrentMonthYYYYMM(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
  return `${year}-${month}`;
}

export interface CategoricalSpend {
  category: string;
  totalSpend: number;
  count: number;
}

export function getCategoricalSpends(transactions: Transaction[]): CategoricalSpend[] {
  const categoryMap = new Map<
    string,
    { total: number; count: number }
  >();
  transactions.forEach((transaction) => {
    const category = transaction.category?.trim();
    if (!category) return;
    const current = categoryMap.get(category) || {
      total: 0,
      count: 0,
    };
    categoryMap.set(category, {
      total: current.total + transaction.amount,
      count: current.count + 1,
    });
  });
  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      totalSpend: data.total,
      count: data.count,
    }))
    .sort((a, b) => b.totalSpend - a.totalSpend);
}

export function toMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function monthLabelFromKey(key: string): string {
  const [y, m] = key.split("-").map((v) => parseInt(v, 10));
  const d = new Date(y, m - 1, 1);
  return formatMonthYear(d);
}


