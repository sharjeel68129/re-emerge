"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types/database";

export default function ProfileSetup({
  userId,
  profile,
  onSaved,
}: {
  userId: string;
  profile: Profile | null;
  onSaved: (p: Profile) => void;
}) {
  const [program, setProgram] = useState(profile?.program ?? "");
  const [startDate, setStartDate] = useState(profile?.start_date ?? "");
  const [gradDate, setGradDate] = useState(
    profile?.target_graduation_date ?? ""
  );
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        program: program || null,
        start_date: startDate || null,
        target_graduation_date: gradDate || null,
      })
      .select()
      .single();
    setSaving(false);
    if (!error && data) onSaved(data as Profile);
  }

  return (
    <form
      onSubmit={save}
      className="border border-gold/60 bg-gold/5 p-4 mb-6 space-y-3"
    >
      <p className="text-sm text-ink">
        Set your program dates once, so the graduation record can frame
        everything against your actual four years.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-ink2 mb-1">Program</label>
          <input
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            className="focus-ring w-full border border-rule bg-white/60 px-2 py-1 text-sm outline-none"
            placeholder="e.g. B.Sc. Computer Science"
          />
        </div>
        <div>
          <label className="block text-xs text-ink2 mb-1">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="focus-ring w-full border border-rule bg-white/60 px-2 py-1 text-sm font-mono outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-ink2 mb-1">
            Target graduation
          </label>
          <input
            type="date"
            value={gradDate}
            onChange={(e) => setGradDate(e.target.value)}
            className="focus-ring w-full border border-rule bg-white/60 px-2 py-1 text-sm font-mono outline-none"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="focus-ring bg-ink text-paper text-sm px-4 py-1.5 hover:bg-ink2 transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
