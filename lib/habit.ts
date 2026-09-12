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
