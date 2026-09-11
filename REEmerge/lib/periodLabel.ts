import { Semester, Task, TaskCategory } from "@/types/database";

/**
 * The date a task actually counts under: the effective_date the person
 * chose (e.g. filing tonight's entry under tomorrow), or when it was
 * created if they never set one.
 */
export function taskDate(task: Pick<Task, "effective_date" | "created_at">): string {
  return task.effective_date ?? task.created_at;
}

/**
 * The label a task is filed under, derived from its effective date.
 * For "semester", if the person has defined their own semester date
 * ranges, we use whichever one the date falls into — real academic
 * calendars don't line up with a fixed Jul/Jan split. Falls back to a
 * Fall/Spring guess only if no ranges are defined or none match.
 */
export function periodLabel(
  category: TaskCategory,
  dateIso: string,
  semesters: Semester[] = []
): string | null {
  const d = new Date(dateIso);

  switch (category) {
    case "daily": {
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    case "weekly": {
      const day = d.getDay();
      const daysUntilSunday = (7 - day) % 7;
      const end = new Date(d);
      end.setDate(d.getDate() + daysUntilSunday);
      const start = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const endLabel = end.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return `${start} – ${endLabel}`;
    }

    case "monthly": {
      const month = d.toLocaleDateString(undefined, { month: "long" });
      return `${month}-${d.getFullYear()}`;
    }

    case "semester": {
      const match = semesters.find((s) => {
        const start = new Date(s.start_date);
        const end = new Date(s.end_date);
        return d >= start && d <= end;
      });
      if (match) return match.label;
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const isFall = month >= 7;
      return isFall ? `Fall ${year} (undefined range)` : `Spring ${year} (undefined range)`;
    }

    case "yearly":
      return String(d.getFullYear());

    case "before_graduation":
      return null;
  }
}

function endOfDay(d: Date): Date {
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * When a task's period is over — i.e. the point after which a resolved
 * (completed/failed/excused) task should be archived out of the active
 * view. Returns null for categories that never end on their own
 * ("before_graduation").
 */
export function periodEnd(
  category: TaskCategory,
  dateIso: string,
  semesters: Semester[] = []
): Date | null {
  const d = new Date(dateIso);

  switch (category) {
    case "daily":
      return endOfDay(d);

    case "weekly": {
      const day = d.getDay();
      const daysUntilSunday = (7 - day) % 7;
      const end = new Date(d);
      end.setDate(d.getDate() + daysUntilSunday);
      return endOfDay(end);
    }

    case "monthly": {
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      return endOfDay(end);
    }

    case "semester": {
      const match = semesters.find((s) => {
        const start = new Date(s.start_date);
        const end = new Date(s.end_date);
        return d >= start && d <= end;
      });
      if (match) return endOfDay(new Date(match.end_date));
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const isFall = month >= 7;
      // Fallback guess when no semester range is defined.
      return isFall ? endOfDay(new Date(year, 11, 31)) : endOfDay(new Date(year, 5, 30));
    }

    case "yearly":
      return endOfDay(new Date(d.getFullYear(), 11, 31));

    case "before_graduation":
      return null;
  }
}

/** How far before a deadline the warning indicator should appear. */
export function warningThresholdMs(category: TaskCategory): number | null {
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;
  switch (category) {
    case "daily":
      return 3 * HOUR;
    case "weekly":
      return 1 * DAY;
    case "monthly":
    case "semester":
    case "yearly":
      return 7 * DAY;
    case "before_graduation":
      return null;
  }
}

/** Whether a deadline warning should show right now for a given deadline. */
export function isDeadlineWarning(
  category: TaskCategory,
  deadlineIso: string | null,
  resolved: boolean
): boolean {
  if (!deadlineIso || resolved) return false;
  const threshold = warningThresholdMs(category);
  if (threshold === null) return false;
  const now = Date.now();
  const deadline = new Date(deadlineIso).getTime();
  return now >= deadline - threshold;
}
