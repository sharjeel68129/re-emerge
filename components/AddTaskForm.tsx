"use client";

import { useState } from "react";
import { DeadlineMode, Semester, TaskCategory, TaskType } from "@/types/database";
import { periodLabel } from "@/lib/periodLabel";

function defaultLocalDate(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function defaultLocalMonth(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

const FOR_DATE_COPY: Record<TaskCategory, string> = {
  daily: "Which day is this for?",
  weekly: "Which week is this for?",
  monthly: "Which month is this for?",
  semester: "Which semester is this for?",
  yearly: "Which year is this for?",
  before_graduation: "",
};

export interface NewSubtask {
  title: string;
  deadline: string | null; // ISO, only used when deadlineMode = per_subtask
}

export interface AddTaskPayload {
  title: string;
  notes: string | null;
  effectiveDate: string | null;
  deadline: string | null; // used when there are no subtasks, or deadlineMode = single
  deadlineMode: DeadlineMode;
  taskType: TaskType;
  targetValue: string | null;
  subtasks: NewSubtask[];
}

export default function AddTaskForm({
  category,
  semesters,
  onAdd,
}: {
  category: TaskCategory;
  semesters: Semester[];
  onAdd: (payload: AddTaskPayload) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [forDate, setForDate] = useState(
    category === "monthly" ? defaultLocalMonth() : defaultLocalDate()
  );
  const [semesterId, setSemesterId] = useState(semesters[0]?.id ?? "");
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const [wantsSubtasks, setWantsSubtasks] = useState(false);
  const [subtaskDraft, setSubtaskDraft] = useState("");
  const [subtasks, setSubtasks] = useState<NewSubtask[]>([]);
  const [deadlineMode, setDeadlineMode] = useState<DeadlineMode>("single");

  const [taskType, setTaskType] = useState<TaskType>("qualitative");
  const [targetValue, setTargetValue] = useState("");

  function addSubtaskDraft() {
    if (!subtaskDraft.trim()) return;
    setSubtasks((prev) => [...prev, { title: subtaskDraft.trim(), deadline: null }]);
    setSubtaskDraft("");
  }

  function updateSubtaskDeadline(index: number, value: string) {
    setSubtasks((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, deadline: value ? new Date(value).toISOString() : null } : s
      )
    );
  }

  function removeSubtask(index: number) {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  }

  function resolveEffectiveDate(): string | null {
    if (category === "monthly" && forDate) {
      return new Date(`${forDate}-01T00:00:00`).toISOString();
    }
    if (category === "semester" && semesters.length > 0 && semesterId) {
      const chosen = semesters.find((s) => s.id === semesterId);
      return chosen ? new Date(`${chosen.start_date}T00:00:00`).toISOString() : null;
    }
    if (category !== "before_graduation" && forDate) {
      return new Date(`${forDate}T00:00:00`).toISOString();
    }
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);

    await onAdd({
      title: title.trim(),
      notes: notes.trim() ? notes.trim() : null,
      effectiveDate: resolveEffectiveDate(),
      deadline: deadline ? new Date(deadline).toISOString() : null,
      deadlineMode: subtasks.length > 0 ? deadlineMode : "single",
      taskType: subtasks.length > 0 ? "qualitative" : taskType,
      targetValue: subtasks.length === 0 && taskType === "quantitative" && targetValue.trim()
        ? targetValue.trim()
        : null,
      subtasks,
    });

    setTitle("");
    setDeadline("");
    setNotes("");
    setSubtasks([]);
    setWantsSubtasks(false);
    setDeadlineMode("single");
    setTaskType("qualitative");
    setTargetValue("");
    setExpanded(false);
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="border border-rule bg-white/40 p-4">
      <div className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setExpanded(true)}
          placeholder="Add a task…"
          className="focus-ring flex-1 bg-transparent border-b border-rule py-1 text-ink outline-none placeholder:text-ink2/60"
        />
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="focus-ring bg-ink text-paper text-sm px-4 py-1 hover:bg-ink2 disabled:opacity-40 transition-colors"
        >
          Add
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {category !== "before_graduation" && (
              <div>
                <label className="block text-xs text-ink2 mb-1">{FOR_DATE_COPY[category]}</label>
                {category === "semester" && semesters.length > 0 ? (
                  <select
                    value={semesterId}
                    onChange={(e) => setSemesterId(e.target.value)}
                    className="focus-ring w-full border border-rule bg-white/60 px-2 py-1 text-sm outline-none"
                  >
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={category === "monthly" ? "month" : "date"}
                    value={forDate}
                    onChange={(e) => setForDate(e.target.value)}
                    className="focus-ring w-full border border-rule bg-white/60 px-2 py-1 text-sm font-mono outline-none"
                  />
                )}
                {category === "weekly" && forDate && (
                  <p className="text-xs text-ink2 mt-1 font-mono">
                    {periodLabel("weekly", new Date(`${forDate}T00:00:00`).toISOString())}
                  </p>
                )}
                {category === "semester" && semesters.length === 0 && (
                  <p className="text-xs text-ink2 mt-1">
                    No semesters defined yet — add one from "manage semester dates" above.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs text-ink2 mb-1">Notes (optional)</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="focus-ring w-full border border-rule bg-white/60 px-2 py-1 text-sm outline-none"
                placeholder="Any detail worth remembering later"
              />
            </div>
          </div>

          {/* Subtasks */}
          <div className="border-t border-rule pt-3">
            <label className="flex items-center gap-2 text-xs text-ink2 mb-2">
              <input
                type="checkbox"
                checked={wantsSubtasks}
                onChange={(e) => {
                  setWantsSubtasks(e.target.checked);
                  if (!e.target.checked) setSubtasks([]);
                }}
                className="focus-ring"
              />
              Break this into subtasks
            </label>

            {wantsSubtasks && (
              <div className="space-y-2">
                {subtasks.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm text-ink flex-1">{s.title}</span>
                    {deadlineMode === "per_subtask" && (
                      <input
                        type="datetime-local"
                        onChange={(e) => updateSubtaskDeadline(i, e.target.value)}
                        className="focus-ring border border-rule bg-white/60 px-1.5 py-0.5 text-xs font-mono outline-none"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeSubtask(i)}
                      className="focus-ring text-ink2 hover:text-rust text-xs"
                    >
                      remove
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    value={subtaskDraft}
                    onChange={(e) => setSubtaskDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSubtaskDraft();
                      }
                    }}
                    placeholder="Subtask title…"
                    className="focus-ring flex-1 border border-rule bg-white/60 px-2 py-1 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={addSubtaskDraft}
                    className="focus-ring text-sm border border-rule px-3 py-1 hover:bg-white/60"
                  >
                    + subtask
                  </button>
                </div>

                {subtasks.length > 0 && (
                  <div className="pt-1">
                    <span className="block text-xs text-ink2 mb-1">Deadlines</span>
                    <label className="flex items-center gap-2 text-xs text-ink mb-1">
                      <input
                        type="radio"
                        checked={deadlineMode === "single"}
                        onChange={() => setDeadlineMode("single")}
                        className="focus-ring"
                      />
                      One deadline for the whole task
                    </label>
                    <label className="flex items-center gap-2 text-xs text-ink">
                      <input
                        type="radio"
                        checked={deadlineMode === "per_subtask"}
                        onChange={() => setDeadlineMode("per_subtask")}
                        className="focus-ring"
                      />
                      A separate deadline for each subtask
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Deadline (single mode, or no subtasks at all) */}
          {(subtasks.length === 0 || deadlineMode === "single") && (
            <div>
              <label className="block text-xs text-ink2 mb-1">Deadline (optional)</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="focus-ring w-full border border-rule bg-white/60 px-2 py-1 text-sm font-mono outline-none"
              />
            </div>
          )}

          {/* Qualitative / quantitative — only meaningful without subtasks */}
          {subtasks.length === 0 && (
            <div className="border-t border-rule pt-3">
              <span className="block text-xs text-ink2 mb-1">Type</span>
              <label className="flex items-center gap-2 text-xs text-ink mb-1">
                <input
                  type="radio"
                  checked={taskType === "qualitative"}
                  onChange={() => setTaskType("qualitative")}
                  className="focus-ring"
                />
                Qualitative — just tick it off
              </label>
              <label className="flex items-center gap-2 text-xs text-ink mb-2">
                <input
                  type="radio"
                  checked={taskType === "quantitative"}
                  onChange={() => setTaskType("quantitative")}
                  className="focus-ring"
                />
                Quantitative — set a target, log a result later
              </label>
              {taskType === "quantitative" && (
                <input
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="Target, e.g. &quot;Run 5km&quot; or &quot;Score 90%&quot;"
                  className="focus-ring w-full border border-rule bg-white/60 px-2 py-1 text-sm outline-none"
                />
              )}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
