// Mirrors the web app's IST and rupee formatting. Implemented without Intl so
// output does not depend on the device's ICU data.
const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LONG_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type IstDay = { year: number; monthIndex: number; day: number };

function istParts(date: Date) {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    monthIndex: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
  };
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function startOfIstDay({ year, monthIndex, day }: IstDay) {
  return new Date(Date.UTC(year, monthIndex, day) - IST_OFFSET_MS);
}

function endOfIstDay(day: IstDay) {
  return new Date(startOfIstDay(day).getTime() + DAY_MS - 1);
}

function groupIndian(value: number) {
  const digits = Math.round(Math.abs(value)).toString();
  if (digits.length <= 3) return digits;
  const head = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${head},${digits.slice(-3)}`;
}

/** `₹1,25,000` — whole rupees with Indian digit grouping, like the web dashboard. */
export function formatCurrency(value: number) {
  return `${value < 0 ? '-' : ''}₹${groupIndian(value)}`;
}

function pad(value: number) {
  return value.toString().padStart(2, '0');
}

/** `Today, 14:05`, `Yesterday, 09:30`, `24 Sep, 14:05`, or `24 Sep 2025, 14:05` in IST. */
export function formatTransactionTime(timestamp: string, now = new Date()) {
  const parts = istParts(new Date(timestamp));
  const today = istParts(now);
  const yesterday = istParts(new Date(now.getTime() - DAY_MS));
  const time = `${pad(parts.hours)}:${pad(parts.minutes)}`;
  const sameDay = (other: IstDay) =>
    other.year === parts.year && other.monthIndex === parts.monthIndex && other.day === parts.day;
  if (sameDay(today)) return `Today, ${time}`;
  if (sameDay(yesterday)) return `Yesterday, ${time}`;
  const year = parts.year === today.year ? '' : ` ${parts.year}`;
  return `${parts.day} ${SHORT_MONTHS[parts.monthIndex]}${year}, ${time}`;
}

export type MonthToDate = {
  monthName: string;
  /** e.g. `1 SEP – 29 SEP` */
  label: string;
  daysLeft: number;
  startDate: Date;
  endDate: Date;
  /** Same days of the previous month, matching the web "previous month to date" comparison. */
  previousStartDate: Date;
  previousEndDate: Date;
};

export function getMonthToDate(now = new Date()): MonthToDate {
  const { year, monthIndex, day } = istParts(now);
  const previousYear = monthIndex === 0 ? year - 1 : year;
  const previousMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
  const previousDay = Math.min(day, daysInMonth(previousYear, previousMonthIndex));
  const month = SHORT_MONTHS[monthIndex].toUpperCase();
  return {
    monthName: LONG_MONTHS[monthIndex],
    label: `1 ${month} – ${day} ${month}`,
    daysLeft: daysInMonth(year, monthIndex) - day,
    startDate: startOfIstDay({ year, monthIndex, day: 1 }),
    endDate: endOfIstDay({ year, monthIndex, day }),
    previousStartDate: startOfIstDay({ year: previousYear, monthIndex: previousMonthIndex, day: 1 }),
    previousEndDate: endOfIstDay({ year: previousYear, monthIndex: previousMonthIndex, day: previousDay }),
  };
}

export function formatPercent(part: number, total: number) {
  if (total <= 0) return '0%';
  return `${((part / total) * 100).toFixed(1)}%`;
}
