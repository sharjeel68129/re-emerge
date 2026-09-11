"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BASELINE, NamazLog, NamazQaza, PRAYER_LABELS, PRAYER_ORDER, Prayer } from "@/types/namaz";
import TopNav from "@/components/TopNav";
import ConfirmNoteDialog from "@/components/ConfirmNoteDialog";
import ConfirmDialog from "@/components/ConfirmDialog";

function todayLocal(): string {
  const d = new Date();
  if (d.getHours() < 4) d.setDate(d.getDate() - 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function NamazDashboard({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [logs, setLogs] = useState<NamazLog[]>([]);
  const [qaza, setQaza] = useState<NamazQaza[]>([]);
  const [loading, setLoading] = useState(true);
  const [missedFor, setMissedFor] = useState<Prayer | null>(null);
  const [qazaInput, setQazaInput] = useState<Record<Prayer, string>>({
    fajr: "1", zuhr: "1", asr: "1", maghrib: "1", isha: "1",
  });
  const [pendingQaza, setPendingQaza] = useState<{ prayer: Prayer; count: number } | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const today = todayLocal();

  const fetchAll = useCallback(async () => {
    const [{ data: logData }, { data: qazaData }] = await Promise.all([
      supabase.from("namaz_logs").select("*").order("date", { ascending: true }),
      supabase.from("namaz_qaza").select("*").order("prayed_at", { ascending: true }),
    ]);
    setLogs((logData as NamazLog[]) ?? []);
    setQaza((qazaData as NamazQaza[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const todayLogs = useMemo(() => {
    const map: Partial<Record<Prayer, NamazLog>> = {};
    for (const l of logs) if (l.date === today) map[l.prayer] = l;
    return map;
  }, [logs, today]);

  const counters = useMemo(() => {
    const c: Record<Prayer, number> = { ...BASELINE };
    for (const l of logs) if (l.status === "missed") c[l.prayer] -= 1;
    for (const q of qaza) c[q.prayer] += 1;
    return c;
  }, [logs, qaza]);

  const qazaCounts = useMemo(() => {
    const c: Record<Prayer, number> = { fajr: 0, zuhr: 0, asr: 0, maghrib: 0, isha: 0 };
    for (const q of qaza) c[q.prayer] += 1;
    return c;
  }, [qaza]);

  async function upsertToday(prayer: Prayer, status: "prayed" | "missed", excused: boolean, note: string | null) {
    const { data, error } = await supabase
      .from("namaz_logs")
      .upsert(
        { user_id: userId, prayer, date: today, status, excused, excuse_note: note },
        { onConflict: "user_id,prayer,date" }
      )
      .select()
      .single();
    if (!error && data) {
      setLogs((prev) => [...prev.filter((l) => !(l.prayer === prayer && l.date === today)), data as NamazLog]);
    }
  }

  async function undo(prayer: Prayer) {
    const log = todayLogs[prayer];
    if (!log) return;
    const { error } = await supabase.from("namaz_logs").delete().eq("id", log.id);
    if (!error) setLogs((prev) => prev.filter((l) => l.id !== log.id));
  }

  async function logQaza(prayer: Prayer, count: number) {
    const rows = Array.from({ length: count }, () => ({ user_id: userId, prayer }));
    const { data, error } = await supabase.from("namaz_qaza").insert(rows).select();
    if (!error && data) setQaza((prev) => [...prev, ...(data as NamazQaza[])]);
  }

  async function undoLastQaza(prayer: Prayer) {
    const entries = qaza.filter((q) => q.prayer === prayer).sort((a, b) => b.prayed_at.localeCompare(a.prayed_at));
    const last = entries[0];
    if (!last) return;
    const { error } = await supabase.from("namaz_qaza").delete().eq("id", last.id);
    if (!error) setQaza((prev) => prev.filter((q) => q.id !== last.id));
  }

  async function downloadPdf() {
    setPdfLoading(true);
    try {
      const res = await fetch("/api/namaz-pdf", { method: "POST" });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "namaz-record.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-6 py-10">
      <TopNav active="namaz" />

      <h2 className="font-serif text-2xl text-ink mb-1">Today</h2>
      <p className="text-ink2 text-xs font-mono mb-6">{today}</p>

      {loading ? (
        <p className="text-ink2 text-sm">Loading…</p>
      ) : (
        <ul className="mb-10">
          {PRAYER_ORDER.map((p) => {
            const log = todayLogs[p];
            return (
              <li key={p} className="flex items-center justify-between py-3 border-b border-rule gap-3">
                <div className="min-w-0">
                  <span className="text-ink">{PRAYER_LABELS[p]}</span>
                  {log && (
                    <span
                      className={[
                        "ml-2 text-xs font-mono",
                        log.status === "prayed" ? "text-moss" : log.excused ? "text-gold" : "text-rust",
                      ].join(" ")}
                    >
                      {log.status === "prayed" ? "prayed" : log.excused ? "missed · excused" : "missed"}
                    </span>
                  )}
                  {log?.excuse_note && <p className="text-xs text-ink2 mt-0.5">{log.excuse_note}</p>}
                </div>
                {!log ? (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => upsertToday(p, "prayed", false, null)}
                      className="focus-ring text-xs bg-moss text-paper px-2 py-1"
                    >
                      prayed
                    </button>
                    <button
                      onClick={() => setMissedFor(p)}
                      className="focus-ring text-xs bg-rust text-paper px-2 py-1"
                    >
                      missed
                    </button>
                  </div>
                ) : (
                  <button onClick={() => undo(p)} className="focus-ring text-xs text-ink2 hover:text-ink underline underline-offset-2 shrink-0">
                    undo
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="font-serif text-2xl text-ink mb-1">Standing</h2>
      <p className="text-ink2 text-xs mb-4">
        -1 per miss, +1 per qaza prayed.
      </p>
      <ul className="mb-10">
        {PRAYER_ORDER.map((p) => (
          <li key={p} className="flex items-center justify-between py-2 border-b border-rule text-sm gap-3 flex-wrap">
            <span className="text-ink w-20 shrink-0">{PRAYER_LABELS[p]}</span>
            <span className="font-mono text-ink2 flex-1">
              {counters[p]} <span className="text-xs">({qazaCounts[p]} qaza prayed)</span>
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <input
                type="number"
                min={1}
                value={qazaInput[p]}
                onChange={(e) => setQazaInput((prev) => ({ ...prev, [p]: e.target.value }))}
                className="focus-ring w-14 border border-rule bg-white/60 px-1.5 py-1 text-xs font-mono outline-none"
              />
              <button
                onClick={() => {
                  const n = parseInt(qazaInput[p], 10);
                  if (n > 0) setPendingQaza({ prayer: p, count: n });
                }}
                className="focus-ring text-xs border border-rule px-2 py-1 hover:bg-white/50"
              >
                log qaza
              </button>
              <button
                onClick={() => undoLastQaza(p)}
                disabled={qazaCounts[p] === 0}
                className="focus-ring text-xs text-ink2 hover:text-ink underline underline-offset-2 disabled:opacity-30"
              >
                undo last
              </button>
            </div>
          </li>
        ))}
      </ul>

      <footer className="pt-6 border-t border-rule text-right">
        <button
          onClick={downloadPdf}
          disabled={pdfLoading}
          className="focus-ring border border-gold text-gold text-sm px-4 py-2 hover:bg-gold hover:text-paper transition-colors disabled:opacity-50"
        >
          {pdfLoading ? "Compiling…" : "Generate Namaz record (PDF)"}
        </button>
      </footer>

      {pendingQaza && (
        <ConfirmDialog
          title={`Log ${pendingQaza.count} qaza for ${PRAYER_LABELS[pendingQaza.prayer]}?`}
          message="This adds to your qaza-prayed count and reduces how negative that prayer's standing is."
          confirmLabel="Log it"
          onCancel={() => setPendingQaza(null)}
          onConfirm={() => {
            logQaza(pendingQaza.prayer, pendingQaza.count);
            setPendingQaza(null);
          }}
        />
      )}

      {missedFor && (
        <ConfirmNoteDialog
          title={`Mark ${PRAYER_LABELS[missedFor]} as missed?`}
          message="Leave the note blank if not excused. Either way, a qaza is owed."
          noteLabel="Circumstances (leave blank if not excused)"
          confirmLabel="Mark missed"
          danger
          onCancel={() => setMissedFor(null)}
          onConfirm={(note) => {
            upsertToday(missedFor, "missed", !!note.trim(), note.trim() || null);
            setMissedFor(null);
          }}
        />
      )}
    </main>
  );
}
