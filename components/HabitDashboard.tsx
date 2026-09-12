"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Habit, HabitLog, INTERVAL_PRESETS } from "@/types/habit";
import { currentOccurrenceIndex, occurrenceDueDate, repetitionLabel, todayLocal } from "@/lib/habit";
import TopNav from "@/components/TopNav";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function HabitDashboard({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<Habit | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [intervalDays, setIntervalDays] = useState(7);
  const [customInterval, setCustomInterval] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    const [{ data: h }, { data: l }] = await Promise.all([
      supabase.from("habits").select("*").order("created_at", { ascending: true }),
      supabase.from("habit_logs").select("*"),
    ]);
    const loadedHabits = (h as Habit[]) ?? [];
    let loadedLogs = (l as HabitLog[]) ?? [];

    // Backfill: any occurrence whose window has fully elapsed with no
    // logged row is a miss. This is what keeps the record complete —
    // nothing silently falls through the cracks.
    const today = todayLocal();
    const missingRows: { user_id: string; habit_id: string; occurrence_index: number; due_date: string; status: "missed" }[] = [];
    for (const habit of loadedHabits) {
      const kCurrent = currentOccurrenceIndex(habit, today);
      const existing = new Set(loadedLogs.filter((x) => x.habit_id === habit.id).map((x) => x.occurrence_index));
      for (let k = 0; k < kCurrent; k++) {
        if (!existing.has(k)) {
          missingRows.push({
            user_id: userId,
            habit_id: habit.id,
            occurrence_index: k,
            due_date: occurrenceDueDate(habit, k),
            status: "missed",
          });
        }
      }
    }
    if (missingRows.length > 0) {
      const { data: inserted } = await supabase.from("habit_logs").insert(missingRows).select();
      if (inserted) loadedLogs = [...loadedLogs, ...(inserted as HabitLog[])];
    }

    setHabits(loadedHabits);
    setLogs(loadedLogs);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function addHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const days = customInterval ? parseInt(customInterval, 10) : intervalDays;
    if (!days || days < 1) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("habits")
      .insert({ user_id: userId, name: name.trim(), details: details.trim() || null, interval_days: days })
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      setHabits((prev) => [...prev, data as Habit]);
      setName("");
      setDetails("");
      setCustomInterval("");
    }
  }

  async function tick(habit: Habit) {
    const k = currentOccurrenceIndex(habit, todayLocal());
    const { data, error } = await supabase
      .from("habit_logs")
      .upsert(
        {
          user_id: userId,
          habit_id: habit.id,
          occurrence_index: k,
          due_date: occurrenceDueDate(habit, k),
          status: "done",
          completed_at: new Date().toISOString(),
        },
        { onConflict: "habit_id,occurrence_index" }
      )
      .select()
      .single();
    if (!error && data) {
      setLogs((prev) => [...prev.filter((l) => !(l.habit_id === habit.id && l.occurrence_index === k)), data as HabitLog]);
    }
  }

  async function undoTick(habit: Habit, log: HabitLog) {
    const { error } = await supabase.from("habit_logs").delete().eq("id", log.id);
    if (!error) setLogs((prev) => prev.filter((l) => l.id !== log.id));
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const { error } = await supabase.from("habits").delete().eq("id", pendingDelete.id);
    if (!error) {
      setHabits((prev) => prev.filter((h) => h.id !== pendingDelete.id));
      setLogs((prev) => prev.filter((l) => l.habit_id !== pendingDelete.id));
    }
    setPendingDelete(null);
  }

  async function downloadPdf() {
    setPdfLoading(true);
    try {
      const res = await fetch("/api/habit-pdf", { method: "POST" });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "habit-record.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setPdfLoading(false);
    }
  }

  const today = todayLocal();

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-6 py-10">
      <TopNav active="habit" />

      <form onSubmit={addHabit} className="border border-rule bg-white/40 p-4 mb-8 space-y-3">
        <h2 className="font-serif text-lg text-ink">Add a habit</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Habit name"
          className="focus-ring w-full border border-rule bg-white/60 px-2 py-1.5 text-sm outline-none"
        />
        <input
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Details (optional)"
          className="focus-ring w-full border border-rule bg-white/60 px-2 py-1.5 text-sm outline-none"
        />
        <div className="flex flex-wrap gap-2 items-center">
          {INTERVAL_PRESETS.map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => {
                setIntervalDays(p.days);
                setCustomInterval("");
              }}
              className={[
                "text-xs px-2 py-1 border",
                !customInterval && intervalDays === p.days ? "bg-ink text-paper border-ink" : "border-rule text-ink2 hover:bg-white/60",
              ].join(" ")}
            >
              {p.label}
            </button>
          ))}
          <span className="text-xs text-ink2">or custom:</span>
          <input
            type="number"
            min={1}
            value={customInterval}
            onChange={(e) => setCustomInterval(e.target.value)}
            placeholder="days"
            className="focus-ring w-16 border border-rule bg-white/60 px-1.5 py-1 text-xs font-mono outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="focus-ring bg-ink text-paper text-sm px-4 py-1.5 hover:bg-ink2 disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add habit"}
        </button>
      </form>

      {loading ? (
        <p className="text-ink2 text-sm">Loading…</p>
      ) : habits.length === 0 ? (
        <p className="text-ink2 text-sm py-6 text-center border border-dashed border-rule">No habits yet.</p>
      ) : (
        <ul className="space-y-3 mb-10">
          {habits.map((habit) => {
            const k = currentOccurrenceIndex(habit, today);
            const dueDate = occurrenceDueDate(habit, k);
            const currentLog = logs.find((l) => l.habit_id === habit.id && l.occurrence_index === k);
            const doneCount = logs.filter((l) => l.habit_id === habit.id && l.status === "done").length;
            const missedCount = logs.filter((l) => l.habit_id === habit.id && l.status === "missed").length;
            const periodEnd = new Date(dueDate + "T00:00:00");
            periodEnd.setDate(periodEnd.getDate() + habit.interval_days - 1);
            const daysLeft = Math.max(0, Math.round((periodEnd.getTime() - new Date(today + "T00:00:00").getTime()) / 86400000));

            return (
              <li key={habit.id} className="border border-rule bg-white/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-ink font-medium">{habit.name}</p>
                    {habit.details && <p className="text-sm text-ink2 mt-0.5">{habit.details}</p>}
                    <p className="text-xs font-mono text-ink2 mt-1">
                      {repetitionLabel(habit.interval_days)} · {doneCount} done · {missedCount} missed
                      {daysLeft > 0 && !currentLog && ` · ${daysLeft}d left this period`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {currentLog?.status === "done" ? (
                      <button
                        onClick={() => undoTick(habit, currentLog)}
                        className="focus-ring text-xs bg-moss text-paper px-2 py-1"
                      >
                        done — undo
                      </button>
                    ) : (
                      <button onClick={() => tick(habit)} className="focus-ring text-xs bg-ink text-paper px-3 py-1.5">
                        tick off
                      </button>
                    )}
                    <button
                      onClick={() => setPendingDelete(habit)}
                      className="focus-ring text-xs text-ink2 hover:text-rust"
                    >
                      delete
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <footer className="pt-6 border-t border-rule text-right">
        <button
          onClick={downloadPdf}
          disabled={pdfLoading}
          className="focus-ring border border-gold text-gold text-sm px-4 py-2 hover:bg-gold hover:text-paper transition-colors disabled:opacity-50"
        >
          {pdfLoading ? "Compiling…" : "Generate Habit record (PDF)"}
        </button>
      </footer>

      {pendingDelete && (
        <ConfirmDialog
          title="Delete this habit?"
          message={`"${pendingDelete.name}" and its entire history will be permanently removed.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </main>
  );
}
