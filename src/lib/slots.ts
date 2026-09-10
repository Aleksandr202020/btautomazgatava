import { BUSINESS, HOLIDAYS, SLOT_MINUTES, WORK_DAYS } from "./catalog";
import { rigaNowParts } from "./utils";

export function parseHm(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function formatHm(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function generateSlots(
  open = BUSINESS.open,
  close = BUSINESS.close,
  duration = SLOT_MINUTES,
): string[] {
  const start = parseHm(open);
  const end = parseHm(close);
  const out: string[] = [];
  for (let t = start; t + duration <= end; t += duration) {
    out.push(formatHm(t));
  }
  return out;
}

export function isWorkingDate(isoDate: string): boolean {
  if (HOLIDAYS.includes(isoDate)) return false;
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d));
  const weekday = dt.getUTCDay() === 0 ? 7 : dt.getUTCDay();
  return (WORK_DAYS as readonly number[]).includes(weekday);
}

export function isSlotInPast(isoDate: string, time: string): boolean {
  const now = rigaNowParts();
  if (isoDate < now.date) return true;
  if (isoDate > now.date) return false;
  return parseHm(time) <= now.hours * 60 + now.minutes;
}

export function upcomingDates(count = 14): string[] {
  const now = rigaNowParts();
  const [y, m, d] = now.date.split("-").map(Number);
  const out: string[] = [];
  for (let i = 0; i < 30 && out.length < count; i += 1) {
    const dt = new Date(Date.UTC(y, (m ?? 1) - 1, (d ?? 1) + i));
    const iso = dt.toISOString().slice(0, 10);
    if (isWorkingDate(iso)) out.push(iso);
  }
  return out;
}
