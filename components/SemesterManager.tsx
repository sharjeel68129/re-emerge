"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Semester } from "@/types/database";

export default function SemesterManager({
  userId,
  semesters,
  onChange,
}: {
  userId: string;
  semesters: Semester[];
  onChange: (next: Semester[]) => void;
}) {
  const supabase = createClient();
  const [label, setLabel] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [saving, setSaving] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || !start || !end) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("semesters")
      .insert({ user_id: userId, label: label.trim(), start_date: start, end_date: end })
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      const next = [...semesters, data as Semester].sort((a, b) =>
        a.start_date.localeCompare(b.start_date)
      );
      onChange(next);
      setLabel("");
      setStart("");
      setEnd("");
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from("semesters").delete().eq("id", id);
    if (!error) onChange(semesters.filter((s) => s.id !== id));
  }

  return (
    <div className="border border-rule bg-white/40 p-4 mb-6">
      <p className="text-sm text-ink mb-1">Your semester boundaries</p>
      <p className="text-xs text-ink2 mb-3">
        Tasks in "This Semester" are labeled by whichever range below they
        fall into. Add each term as it starts, or all of them up front if
        you already know your calendar.
      </p>

      {semesters.length > 0 && (
        <ul className="mb-3 divide-y divide-rule">
          {semesters.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-ink">
                {s.label}{" "}
                <span className="text-ink2 font-mono text-xs">
                  ({new Date(s.start_date).toLocaleDateString()} –{" "}
                  {new Date(s.end_date).toLocaleDateString()})
                </span>
              </span>
              <button
                onClick={() => remove(s.id)}
                className="focus-ring text-ink2 hover:text-rust text-xs"
              >
                remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Fall 2026"
          className="focus-ring border border-rule bg-white/60 px-2 py-1 text-sm outline-none sm:col-span-2"
        />
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="focus-ring border border-rule bg-white/60 px-2 py-1 text-sm font-mono outline-none"
        />
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="focus-ring border border-rule bg-white/60 px-2 py-1 text-sm font-mono outline-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="focus-ring sm:col-span-4 bg-ink text-paper text-sm py-1.5 hover:bg-ink2 disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add semester"}
        </button>
      </form>
    </div>
  );
}
