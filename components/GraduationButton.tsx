"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Task } from "@/types/database";
import UnfinishedReview from "@/components/UnfinishedReview";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function GraduationButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reviewQueue, setReviewQueue] = useState<Task[] | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function downloadPdf() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/graduation-pdf", { method: "POST" });
      if (!res.ok) throw new Error("Could not generate the PDF.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "four-year-record.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function startFlow() {
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("completed", false)
      .eq("failed", false)
      .eq("excused", false)
      .is("failure_note", null)
      .order("created_at", { ascending: true });
    setLoading(false);

    if (fetchError) {
      setError("Could not check your unfinished tasks.");
      return;
    }

    const unfinished = (data as Task[]) ?? [];
    if (unfinished.length > 0) {
      setReviewQueue(unfinished);
    } else {
      downloadPdf();
    }
  }

  return (
    <div className="text-right">
      <button
        onClick={() => setConfirming(true)}
        disabled={loading}
        className="focus-ring border border-gold text-gold text-sm px-4 py-2 hover:bg-gold hover:text-paper transition-colors disabled:opacity-50"
      >
        {loading ? "Compiling your record…" : "Generate graduation record (PDF)"}
      </button>
      {error && <p className="text-rust text-xs mt-1">{error}</p>}

      {confirming && (
        <ConfirmDialog
          title="Generate your graduation record?"
          message="This checks for any unfinished tasks first and may ask you to add a note before compiling the PDF."
          confirmLabel="Generate"
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            startFlow();
          }}
        />
      )}

      {reviewQueue && (
        <UnfinishedReview
          tasks={reviewQueue}
          onCancel={() => setReviewQueue(null)}
          onComplete={() => {
            setReviewQueue(null);
            downloadPdf();
          }}
        />
      )}
    </div>
  );
}
