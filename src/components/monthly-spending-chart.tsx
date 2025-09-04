"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  numberToINR,
  getCurrentMonthMeta,
  formatCurrentMonthDayLabel,
  formatISTMonthYear,
} from "@/common/utils";
import type { Transaction } from "@/common/schemas";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Custom tooltip props interface
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: number | string;
  selectedMonth: SelectedMonth;
}

// Custom tooltip to match app styling (uses same tokens/classes as dropdown/card)
function CustomTooltip({
  active,
  payload,
  label,
  selectedMonth,
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const cumulative = payload[0]?.value ?? 0;
  const day = Number(label);
  const dateStr = formatDayLabel(day, selectedMonth);

  return (
    <div className="rounded-md border bg-popover p-2 text-popover-foreground shadow-md">
      <div className="text-sm font-semibold">{dateStr}</div>
      <div className="text-sm text-muted-foreground">
        Cumulative Expenses: {numberToINR(cumulative)}
      </div>
    </div>
  );
}

function getCurrentMonthName() {
  return formatISTMonthYear(new Date());
}

type SelectedMonth = { year: number; month: number } | null; // month: 0-11

function parseTxnDate(txn: Transaction): Date {
  if (typeof (txn as { timestamp?: number }).timestamp === "number") {
    const ts = (txn as { timestamp: number }).timestamp;
    return new Date(ts > 1e12 ? ts : ts * 1000);
  }
  const iso =
    (txn as { ist_datetime?: string; createdAt?: string }).ist_datetime ||
    (txn as { createdAt?: string }).createdAt;
  return new Date(iso!);
}

function getMonthMeta(target: SelectedMonth) {
  if (!target) return getCurrentMonthMeta();
  const { year, month } = target;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { year, month, daysInMonth };
}

function formatDayLabel(day: number, target: SelectedMonth) {
  if (!target) return formatCurrentMonthDayLabel(day);
  const d = new Date(target.year, target.month, day);
  return d.toLocaleDateString("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getCumulativeDailySpendingForMonth(
  transactions: Transaction[],
  target: SelectedMonth,
) {
  const { year, month, daysInMonth } = getMonthMeta(target);
  const dailyTotals: { [day: number]: number } = {};
  for (let i = 1; i <= daysInMonth; i++) dailyTotals[i] = 0;

  let lastTxnDay = 0;
  for (const txn of transactions) {
    const date = parseTxnDate(txn);
    if (date.getFullYear() === year && date.getMonth() === month) {
      const day = date.getDate();
      dailyTotals[day] += Math.abs(txn.amount);
      if (day > lastTxnDay) lastTxnDay = day;
    }
  }

  const length = lastTxnDay > 0 ? lastTxnDay : daysInMonth;
  let running = 0;
  return Array.from({ length }, (_, i) => {
    const day = i + 1;
    running += dailyTotals[day] ?? 0;
    return { day, cumulative: running };
  });
}

export function MonthlySpendingChart({
  transactions,
  selectedMonth = null,
}: {
  transactions: Transaction[];
  selectedMonth?: SelectedMonth;
}) {
  if (!selectedMonth) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="px-2 pt-4 sm:px-4">
          <CardTitle className="text-base font-semibold">
            Expense Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 px-2 pb-4 sm:px-4 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    );
  }

  const { daysInMonth } = getMonthMeta(selectedMonth);
  const data = getCumulativeDailySpendingForMonth(transactions, selectedMonth);
  const xTicks = [1, 10, 20].filter((t) => t < daysInMonth).concat(daysInMonth);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="px-2 pt-4 sm:px-4">
        <CardTitle className="text-base font-semibold">
          Expense Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="h-80 px-2 pb-4 sm:px-4 flex flex-col items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 4, right: 12, left: 0, bottom: 4 }}
          >
            <XAxis
              dataKey="day"
              type="number"
              domain={[1, daysInMonth]}
              ticks={xTicks}
              allowDecimals={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={numberToINR}
              tick={{ fontSize: 12 }}
              width={60}
            />
            <Tooltip
              content={<CustomTooltip selectedMonth={selectedMonth} />}
            />
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="w-full text-center text-sm text-muted-foreground">
          {(() => {
            if (!selectedMonth) return getCurrentMonthName();
            return formatISTMonthYear(
              new Date(selectedMonth.year, selectedMonth.month, 1),
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}
