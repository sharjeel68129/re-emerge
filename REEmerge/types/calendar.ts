export type EventType = "class" | "assessment" | "deadline" | "other";

export interface Course {
  id: string;
  user_id: string;
  code: string;
  name: string;
  color: string;
  lecturer: string | null;
  notes: string | null;
  created_at: string;
}

export interface CourseEvent {
  id: string;
  user_id: string;
  course_id: string;
  type: EventType;
  title: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  weight: string | null;
  notes: string | null;
  confirmed: boolean;
  created_at: string;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  class: "Class",
  assessment: "Assessment",
  deadline: "Deadline",
  other: "Other",
};
