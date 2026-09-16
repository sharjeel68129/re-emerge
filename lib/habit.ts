import { Habit } from "@/types/habit";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function occurrenceDueDate(habit: Pick<Habit, "start_date" | "interval_days">, k: number): string {
  const d = new Date(habit.start_date + "T00:00:00");
  d.setDate(d.getDate() + k * habit.interval_days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Timestamp (ms) when occurrence k's window ends (= start of k+1). */
export function periodEndTimestamp(habit: Pick<Habit, "start_date" | "interval_days">, k: number): number {
  const nextDue = occurrenceDueDate(habit, k + 1);
  return new Date(nextDue + "T00:00:00").getTime();
}

const GRACE_MS = 24 * 60 * 60 * 1000;

/** True once an occurrence's 24h catch-up grace period has fully elapsed. */
export function graceExpired(habit: Pick<Habit, "start_date" | "interval_days">, k: number): boolean {
  return Date.now() >= periodEndTimestamp(habit, k) + GRACE_MS;
}

/** Which occurrence period "today" falls in (0-indexed). */
export function currentOccurrenceIndex(habit: Pick<Habit, "start_date" | "interval_days">, todayISO: string): number {
  const start = new Date(habit.start_date + "T00:00:00").getTime();
  const today = new Date(todayISO + "T00:00:00").getTime();
  const diffDays = Math.floor((today - start) / 86400000);
  return Math.max(0, Math.floor(diffDays / habit.interval_days));
}

export function repetitionLabel(days: number): string {
  if (days === 1) return "Daily";
  if (days === 7) return "Weekly";
  if (days === 14) return "Every 2 weeks";
  return `Every ${days} days`;
}
