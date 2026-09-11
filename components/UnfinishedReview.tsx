"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_LABELS, Task } from "@/types/database";

export default function UnfinishedReview({
  tasks,
  onComplete,
  onCancel,
}: {
  tasks: Task[];
  onComplete: () => void;
  onCancel: () => void;
}) {
  const supabase = createClient();
  const [index, setIndex] = useState(0);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const current = tasks[index];
  const isLast = index === tasks.length - 1;

  function advance() {
    setNote("");
    if (isLast) {
      onComplete();
    } else {
      setIndex((i) => i + 1);
    }
  }

  async function saveAndAdvance() {
    setSaving(true);
    await supabase
      .from("tasks")
      .update({ failure_note: note.trim() || null })
      .eq("id", current.id);
    setSaving(false);
    advance();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-ink/60 flex items-center justify-center px-4 z-50"
    >
      <div className="bg-paper border border-rule max-w-md w-full p-6">
        <p className="text-xs font-mono text-ink2 mb-1">
          {index + 1} of {tasks.length} unfinished
        </p>
        <h2 className="font-serif text-xl text-ink mb-1">{current.title}</h2>
        <p className="text-xs text-ink2 mb-4">
          {CATEGORY_LABELS[current.category]}
          {current.deadline &&
            ` · was due ${new Date(current.deadline).toLocaleDateString()}`}
        </p>

        <label className="block text-sm text-ink2 mb-1">
          What happened with this one? (optional — this goes into your
          graduation record as-is)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          className="focus-ring w-full border border-rule bg-white/60 px-3 py-2 text-sm outline-none resize-none"
          placeholder="Ran out of time, changed priorities, circumstances outside your control…"
        />

        <div className="flex items-center justify-between mt-5">
          <button
            onClick={onCancel}
            className="focus-ring text-sm text-ink2 hover:text-ink underline underline-offset-2"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            <button
              onClick={advance}
              disabled={saving}
              className="focus-ring text-sm text-ink2 border border-rule px-3 py-1.5 hover:text-ink"
            >
              Skip
            </button>
            <button
              onClick={saveAndAdvance}
              disabled={saving}
              className="focus-ring text-sm bg-ink text-paper px-3 py-1.5 hover:bg-ink2 disabled:opacity-50"
            >
              {saving ? "Saving…" : isLast ? "Save & finish" : "Save & next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
