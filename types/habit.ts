export interface Habit {
  id: string;
  user_id: string;
  name: string;
  details: string | null;
  interval_days: number;
  start_date: string;
  created_at: string;
}

export interface HabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  occurrence_index: number;
  due_date: string;
  status: "done" | "missed";
  completed_at: string | null;
  created_at: string;
}

export const INTERVAL_PRESETS: { label: string; days: number }[] = [
  { label: "Daily", days: 1 },
  { label: "Every 3 days", days: 3 },
  { label: "Weekly", days: 7 },
  { label: "Every 2 weeks", days: 14 },
];
