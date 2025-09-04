export const numberToINR = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

// Use fixed locale and timezone for deterministic SSR/CSR formatting
const DATE_LOCALE = "en-GB"; // 24h by default, e.g., 18:34, and "Sept"
const IST_TIMEZONE = "Asia/Kolkata";

export function formatISTDateTime(dateInput: number | string | Date): string {
  const d = new Date(dateInput);
  return d.toLocaleString(DATE_LOCALE, {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatISTDate(dateInput: number | string | Date): string {
  const d = new Date(dateInput);
  return d.toLocaleDateString(DATE_LOCALE, {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatISTTime(dateInput: number | string | Date): string {
  const d = new Date(dateInput);
  return d.toLocaleTimeString(DATE_LOCALE, {
    timeZone: IST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatISTMonthYear(dateInput: number | string | Date): string {
  const d = new Date(dateInput);
  return d.toLocaleString(DATE_LOCALE, {
    timeZone: IST_TIMEZONE,
    month: "long",
    year: "numeric",
  });
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
  return date.toLocaleDateString(DATE_LOCALE, {
    timeZone: IST_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
    const date = new Date(txn.ist_datetime || txn.createdAt);
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