"use client";

import { useState } from "react";
import { Task } from "@/types/database";
import ConfirmDialog from "@/components/ConfirmDialog";

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface TaskEdits {
  title: string;
  notes: string | null;
  deadline: string | null;
  effective_date: string | null;
}

export default function EditTaskModal({
  task,
  onSave,
  onCancel,
}: {
  task: Task;
  onSave: (updates: TaskEdits) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [deadline, setDeadline] = useState(toLocalInputValue(task.deadline));
  const [effectiveDate, setEffectiveDate] = useState(toLocalInputValue(task.effective_date));
  const [saving, setSaving] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<TaskEdits | null>(null);

  function buildEdits(): TaskEdits {
    return {
      title: title.trim(),
      notes: notes.trim() ? notes.trim() : null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      effective_date: effectiveDate ? new Date(effectiveDate).toISOString() : null,
    };
  }

  function datesChanged(edits: TaskEdits): boolean {
    return edits.deadline !== (task.deadline ?? null) || edits.effective_date !== (task.effective_date ?? null);
  }

  async function actuallySave(edits: TaskEdits) {
    setSaving(true);
    await onSave(edits);
    setSaving(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const edits = buildEdits();
    if (datesChanged(edits)) {
      setPendingConfirm(edits);
    } else {
      actuallySave(edits);
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-ink/60 flex items-center justify-center px-4 z-50">
      <form onSubmit={submit} className="bg-paper border border-rule max-w-sm w-full p-6 space-y-3">
        <h2 className="font-serif text-lg text-ink mb-1">Edit task</h2>

        <div>
          <label className="block text-xs text-ink2 mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="focus-ring w-full border border-rule bg-white/60 px-2 py-1 text-sm outline-none" />
        </div>

        <div>
          <label className="block text-xs text-ink2 mb-1">Filed under (effective date)</label>
          <input type="datetime-local" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className="focus-ring w-full border border-rule bg-white/60 px-2 py-1 text-sm font-mono outline-none" />
          {effectiveDate && (
            <button type="button" onClick={() => setEffectiveDate("")} className="focus-ring text-xs text-ink2 hover:text-rust mt-1 underline underline-offset-2">
              clear (use date added instead)
            </button>
          )}
        </div>

        <div>
          <label className="block text-xs text-ink2 mb-1">Deadline (optional)</label>
          <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="focus-ring w-full border border-rule bg-white/60 px-2 py-1 text-sm font-mono outline-none" />
          {deadline && (
            <button type="button" onClick={() => setDeadline("")} className="focus-ring text-xs text-ink2 hover:text-rust mt-1 underline underline-offset-2">
              clear deadline
            </button>
          )}
        </div>

        <div>
          <label className="block text-xs text-ink2 mb-1">Notes (optional)</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className="focus-ring w-full border border-rule bg-white/60 px-2 py-1 text-sm outline-none" />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCancel} className="focus-ring text-sm text-ink2 border border-rule px-3 py-1.5 hover:text-ink">Cancel</button>
          <button type="submit" disabled={saving || !title.trim()} className="focus-ring text-sm bg-ink text-paper px-3 py-1.5 hover:bg-ink2 disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>

      {pendingConfirm && (
        <ConfirmDialog
          title="Change this task's date or time?"
          message="You're changing when this task is filed under or when it's due. This affects its label in the app and in your graduation record."
          confirmLabel="Save change"
          onCancel={() => setPendingConfirm(null)}
          onConfirm={() => {
            const edits = pendingConfirm;
            setPendingConfirm(null);
            actuallySave(edits);
          }}
        />
      )}
    </div>
  );
}
