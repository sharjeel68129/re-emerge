export type TaskCategory =
  | "daily"
  | "weekly"
  | "monthly"
  | "semester"
  | "yearly"
  | "before_graduation";

export type DeadlineMode = "single" | "per_subtask";
export type TaskType = "qualitative" | "quantitative";

export interface Task {
  id: string;
  user_id: string;
  category: TaskCategory;
  title: string;
  notes: string | null;

  completed: boolean;
  completed_at: string | null;
  failed: boolean;
  failed_at: string | null;
  excused: boolean;
  excused_at: string | null;
  excuse_note: string | null;

  failure_note: string | null;
  effective_date: string | null;

  deadline: string | null;
  deadline_mode: DeadlineMode;

  task_type: TaskType;
  target_value: string | null;
  result_value: string | null;

  archived: boolean;
  order_index: number;

  created_at: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  user_id: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
  deadline: string | null;
  order_index: number;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  program: string | null;
  start_date: string | null;
  target_graduation_date: string | null;
  created_at: string;
}

export interface Semester {
  id: string;
  user_id: string;
  label: string;
  start_date: string; // date, e.g. "2026-09-01"
  end_date: string;
  created_at: string;
}

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  semester: "This Semester",
  yearly: "This Year",
  before_graduation: "Before I Graduate",
};

export const CATEGORY_ORDER: TaskCategory[] = [
  "daily",
  "weekly",
  "monthly",
  "semester",
  "yearly",
  "before_graduation",
];

/** True once a task's outcome is settled — completed, failed, or excused. */
export function isResolved(task: Task): boolean {
  return task.completed || task.failed || task.excused;
}
