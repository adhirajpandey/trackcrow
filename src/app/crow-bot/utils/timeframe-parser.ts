// app/crow-bot/utils/timeframe-parser.ts

export function parseTimeframeFromText(text: string): {
  startDate?: string;
  endDate?: string;
  inferred?: boolean;
} {
  const now = new Date();
  const lower = text.toLowerCase();

  function toISO(date: Date) {
    return date.toISOString().split("T")[0];
  }

  const start = new Date(now);
  const end = new Date(now);

  // --- Week-based ---
  if (/\b(last week|previous week)\b/.test(lower)) {
    const day = now.getDay();
    const diffToMonday = (day === 0 ? 6 : day - 1) + 7;
    start.setDate(now.getDate() - diffToMonday);
    end.setDate(start.getDate() + 6);
    return { startDate: toISO(start), endDate: toISO(end), inferred: true };
  }

  if (/\b(this week|current week)\b/.test(lower)) {
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    start.setDate(now.getDate() - diffToMonday);
    end.setDate(start.getDate() + 6);
    return { startDate: toISO(start), endDate: toISO(end), inferred: true };
  }

  // --- Month-based ---
  if (/\b(last month|previous month)\b/.test(lower)) {
    start.setMonth(now.getMonth() - 1, 1);
    end.setMonth(now.getMonth(), 0); // last day of last month
    return { startDate: toISO(start), endDate: toISO(end), inferred: true };
  }

  if (/\b(this month|current month)\b/.test(lower)) {
    start.setDate(1);
    end.setMonth(now.getMonth() + 1, 0);
    return { startDate: toISO(start), endDate: toISO(end), inferred: true };
  }

  // --- Year-based ---
  if (/\b(last year|previous year)\b/.test(lower)) {
    start.setFullYear(now.getFullYear() - 1, 0, 1);
    end.setFullYear(now.getFullYear() - 1, 11, 31);
    return { startDate: toISO(start), endDate: toISO(end), inferred: true };
  }

  if (/\b(this year|current year)\b/.test(lower)) {
    start.setMonth(0, 1);
    end.setMonth(11, 31);
    return { startDate: toISO(start), endDate: toISO(end), inferred: true };
  }

  // --- Day-based ---
  if (/\btoday\b/.test(lower)) {
    return { startDate: toISO(now), endDate: toISO(now), inferred: true };
  }

  if (/\byesterday\b/.test(lower)) {
    start.setDate(now.getDate() - 1);
    end.setDate(now.getDate() - 1);
    return { startDate: toISO(start), endDate: toISO(end), inferred: true };
  }

  // --- Rolling periods ---
  if (/\bpast\s*(\d+)\s*days?\b/.test(lower)) {
    const days = parseInt(lower.match(/\bpast\s*(\d+)\s*days?\b/)?.[1] || "7");
    start.setDate(now.getDate() - days);
    return { startDate: toISO(start), endDate: toISO(end), inferred: true };
  }

  if (/\blast\s*(\d+)\s*days?\b/.test(lower)) {
    const days = parseInt(lower.match(/\blast\s*(\d+)\s*days?\b/)?.[1] || "7");
    start.setDate(now.getDate() - days);
    return { startDate: toISO(start), endDate: toISO(end), inferred: true };
  }

  return {};
}
