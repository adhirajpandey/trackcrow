const IST = 330 * 60_000;
const DAY = 86_400_000;
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function istDateKey(timestamp: string | Date): string {
  return new Date(new Date(timestamp).getTime() + IST).toISOString().slice(0, 10);
}
export function isDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function monthPeriod(offset = 0, now = new Date()) {
  const shifted = new Date(now.getTime() + IST);
  const first = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() + offset, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0));
  return {
    label: offset === 0 ? 'This month' : `${months[first.getUTCMonth()]} ${first.getUTCFullYear()}`,
    startDate: first.toISOString().slice(0, 10),
    endDate: last.toISOString().slice(0, 10),
  };
}
export function dateRange(startDate: string, endDate: string) {
  if (!isDateKey(startDate) || !isDateKey(endDate) || startDate > endDate) return null;
  return {
    startDate: new Date(new Date(`${startDate}T00:00:00Z`).getTime() - IST),
    endDate: new Date(new Date(`${endDate}T00:00:00Z`).getTime() - IST + DAY - 1),
  };
}
export function dayLabel(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return `${day} ${months[month - 1]} ${year}`;
}
export function istDateTime(timestamp: string) {
  return new Date(new Date(timestamp).getTime() + IST).toISOString().slice(0, 16).replace('T', ' ');
}
export function parseIstDateTime(value: string): string | null {
  const match = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})$/.exec(value.trim());
  if (!match || !isDateKey(match[1]) || Number(match[2]) > 23 || Number(match[3]) > 59) return null;
  return new Date(`${match[1]}T${match[2]}:${match[3]}:00+05:30`).toISOString();
}
