import { DateRange } from "react-day-picker";

export const epochToGMT530 = (epoch: number): string => {
  // Convert epoch to milliseconds
  const date = new Date(epoch * 1000);

  // Offset in minutes for GMT+5:30
  const offsetMinutes = 5 * 60 + 30;

  // Apply the offset
  const gmt530Date = new Date(date.getTime() + offsetMinutes * 60 * 1000);

  // Format the date to a readable string
  const gmt530DateWithSeconds = gmt530Date
    .toISOString()
    .replace("T", " ")
    .replace("Z", "");

  // Last index of the colon to strip seconds from date
  const lastIndexOfColon = gmt530DateWithSeconds.lastIndexOf(":");

  return gmt530DateWithSeconds.substring(0, lastIndexOfColon);
};

export const convertDateRangeToEpoch = (
  dateRange: DateRange | undefined
): {
  from: number | null;
  to: number | null;
} => {
  if (!dateRange) {
    return { from: null, to: null };
  }

  const fromEpoch = dateRange.from
    ? Math.floor(dateRange.from.getTime() / 1000)
    : null;
  const toEpoch = dateRange.to
    ? Math.floor(dateRange.to.getTime() / 1000)
    : null;

  return { from: fromEpoch, to: toEpoch };
};
