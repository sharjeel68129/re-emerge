"use client";

import { useState } from "react";
import { isResolved, Semester, Subtask, Task } from "@/types/database";
import { periodLabel, taskDate, isDeadlineWarning } from "@/lib/periodLabel";
import ConfirmNoteDialog from "@/components/ConfirmNoteDialog";

function formatDeadline(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const overdue = d.getTime() < now.getTime();
  const label = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
  return overdue ? `${label} (overdue)` : label;
}

function WarningDot() {
  return (
    <span
      title="Deadline approaching"
      className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-rust text-white text-[10px] font-bold shrink-0"
    >
      !
    </span>
  );
}

export default function TaskItem({
  task,
  subtasks,
  semesters,
  onToggle,
  onDelete,
  onEdit,
  onToggleSubtask,
  onLogResult,
  onFail,
  onExcuse,
}: {
  task: Task;
  subtasks: Subtask[];
  semesters: Semester[];
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onToggleSubtask: (subtask: Subtask, task: Task) => void;
  onLogResult: (task: Task, resultValue: string, met: boolean) => void;
  onFail: (task: Task, note: string) => void;
  onExcuse: (task: Task, note: string) => void;
}) {
  const [showFailConfirm, setShowFailConfirm] = useState(false);
  const [showExcuseConfirm, setShowExcuseConfirm] = useState(false);
  const [loggingResult, setLoggingResult] = useState(false);
  const [resultDraft, setResultDraft] = useState(task.result_value ?? "");

  const resolved = isResolved(task);
  const hasSubtasks = subtasks.length > 0;
  const doneCount = subtasks.filter((s) => s.completed).length;

  const singleDeadlineWarning =
    (!hasSubtasks || task.deadline_mode === "single") &&
    isDeadlineWarning(task.category, task.deadline, resolved);

  return (
    <li className="py-3 border-b border-rule group">
      <div className="flex items-start gap-3">
        {task.task_type === "quantitative" && !hasSubtasks ? (
          <div
            className={[
              "mt-0.5 h-5 w-5 shrink-0 border flex items-center justify-center",
              task.completed ? "bg-moss border-moss" : "border-ink2",
            ].join(" ")}
          />
        ) : hasSubtasks ? (
          <div className="mt-0.5 shrink-0 text-xs font-mono text-ink2 w-9 text-center">
            {doneCount}/{subtasks.length}
          </div>
        ) : (
          <button
            onClick={() => onToggle(task)}
            aria-label={task.completed ? "Mark as not done" : "Mark as done"}
            className={[
              "focus-ring mt-0.5 h-5 w-5 shrink-0 border flex items-center justify-center transition-colors",
              task.completed
                ? "bg-moss border-moss text-paper"
                : task.failed
                ? "bg-rust border-rust text-paper"
                : task.excused
                ? "bg-gold border-gold text-paper"
                : "border-ink2 hover:border-ink",
            ].join(" ")}
          >
            {(task.completed || task.failed || task.excused) && (
              <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
                <path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={["text-ink", resolved && !task.failed && !task.excused ? "line-through text-ink2" : "", task.failed ? "text-rust" : "", task.excused ? "text-gold" : ""].join(" ")}>
              {task.title}
            </p>
            {singleDeadlineWarning && <WarningDot />}
            {task.failed && <span className="text-[10px] font-mono text-rust">FAILED</span>}
            {task.excused && <span className="text-[10px] font-mono text-gold">EXCUSED</span>}
          </div>

          {task.notes && <p className="text-sm text-ink2 mt-0.5">{task.notes}</p>}

          <div className="flex gap-3 mt-1 text-xs font-mono text-ink2 flex-wrap">
            {periodLabel(task.category, taskDate(task), semesters) && (
              <span>{periodLabel(task.category, taskDate(task), semesters)}</span>
            )}
            {(!hasSubtasks || task.deadline_mode === "single") && task.deadline && (
              <span>due {formatDeadline(task.deadline)}</span>
            )}
            {task.completed && task.completed_at && (
              <span className="text-moss">done {new Date(task.completed_at).toLocaleDateString()}</span>
            )}
          </div>

          {task.excuse_note && <p className="text-xs text-gold mt-1">circumstances: {task.excuse_note}</p>}
          {!resolved && task.failure_note && <p className="text-xs text-gold mt-1">note: {task.failure_note}</p>}

          {/* Quantitative result entry */}
          {task.task_type === "quantitative" && !hasSubtasks && (
            <div className="mt-2">
              {task.result_value && (
                <p className="text-xs text-ink2">
                  target: {task.target_value} · result: {task.result_value}
                </p>
              )}
              {!resolved && (
                <>
                  {!loggingResult ? (
                    <button
                      onClick={() => setLoggingResult(true)}
                      className="focus-ring text-xs text-ink2 underline underline-offset-2 hover:text-ink mt-1"
                    >
                      log result
                    </button>
                  ) : (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <input
                        value={resultDraft}
                        onChange={(e) => setResultDraft(e.target.value)}
                        placeholder={`vs. target: ${task.target_value ?? "—"}`}
                        className="focus-ring border border-rule bg-white/60 px-2 py-1 text-xs outline-none flex-1 min-w-[140px]"
                      />
                      <button
                        onClick={() => {
                          onLogResult(task, resultDraft, true);
                          setLoggingResult(false);
                        }}
                        className="focus-ring text-xs bg-moss text-paper px-2 py-1"
                      >
                        target met
                      </button>
                      <button
                        onClick={() => {
                          onLogResult(task, resultDraft, false);
                          setLoggingResult(false);
                        }}
                        className="focus-ring text-xs border border-rule px-2 py-1 text-ink2"
                      >
                        not yet
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Subtasks */}
          {hasSubtasks && (
            <ul className="mt-2 space-y-1.5 border-l border-rule pl-3">
              {subtasks.map((s) => {
                const subWarning =
                  task.deadline_mode === "per_subtask" &&
                  isDeadlineWarning(task.category, s.deadline, s.completed);
                return (
                  <li key={s.id} className="flex items-center gap-2 text-sm">
                    <button
                      onClick={() => onToggleSubtask(s, task)}
                      aria-label={s.completed ? "Mark subtask not done" : "Mark subtask done"}
                      className={[
                        "focus-ring h-4 w-4 shrink-0 border flex items-center justify-center",
                        s.completed ? "bg-moss border-moss text-paper" : "border-ink2",
                      ].join(" ")}
                    >
                      {s.completed && (
                        <svg viewBox="0 0 16 16" width="10" height="10" fill="none">
                          <path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <span className={s.completed ? "line-through text-ink2" : "text-ink"}>{s.title}</span>
                    {subWarning && <WarningDot />}
                    {task.deadline_mode === "per_subtask" && s.deadline && (
                      <span className="text-xs font-mono text-ink2">{formatDeadline(s.deadline)}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-2 text-xs">
            <button onClick={() => onEdit(task)} className="focus-ring text-ink2 hover:text-ink">edit</button>
            {!resolved && (
              <>
                <button onClick={() => setShowFailConfirm(true)} className="focus-ring text-ink2 hover:text-rust">fail</button>
                <button onClick={() => setShowExcuseConfirm(true)} className="focus-ring text-ink2 hover:text-gold">excuse</button>
              </>
            )}
            <button onClick={() => onDelete(task)} aria-label="Delete task" className="focus-ring text-ink2 hover:text-rust">✕</button>
          </div>
        </div>
      </div>

      {showFailConfirm && (
        <ConfirmNoteDialog
          title="Mark this task as failed?"
          message={`"${task.title}" will be marked failed and will drop off the active list 30 minutes after this.`}
          noteLabel="Why did it fail? (optional)"
          confirmLabel="Mark failed"
          danger
          onCancel={() => setShowFailConfirm(false)}
          onConfirm={(note) => {
            onFail(task, note);
            setShowFailConfirm(false);
          }}
        />
      )}
      {showExcuseConfirm && (
        <ConfirmNoteDialog
          title="Couldn't complete due to special circumstances?"
          message={`"${task.title}" will be marked excused, not failed, and will drop off the active list 30 minutes after this.`}
          noteLabel="What were the circumstances?"
          confirmLabel="Mark excused"
          onCancel={() => setShowExcuseConfirm(false)}
          onConfirm={(note) => {
            onExcuse(task, note);
            setShowExcuseConfirm(false);
          }}
        />
      )}
    </li>
  );
}
