"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Course, CourseEvent } from "@/types/calendar";
import TopNav from "@/components/TopNav";

export default function StudyDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<CourseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: e }] = await Promise.all([
        supabase.from("courses").select("*").order("code", { ascending: true }),
        supabase.from("course_events").select("*").order("date", { ascending: true }),
      ]);
      setCourses((c as Course[]) ?? []);
      setEvents((e as CourseEvent[]) ?? []);
      setLoading(false);
      if (c && c.length > 0) setOpen((c as Course[])[0].id);
    })();
  }, [supabase]);

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-6 py-10">
      <TopNav active="study" />

      {loading ? (
        <p className="text-ink2 text-sm">Loading…</p>
      ) : courses.length === 0 ? (
        <p className="text-ink2 text-sm">
          No courses yet — go to RE:Calendar and import your courses first.
        </p>
      ) : (
        <div className="space-y-3">
          {courses.map((c) => {
            const items = events
              .filter((e) => e.course_id === c.id && e.type !== "class")
              .sort((a, b) => a.date.localeCompare(b.date));
            const isOpen = open === c.id;
            return (
              <div key={c.id} className="border border-rule bg-white/40">
                <button
                  onClick={() => setOpen(isOpen ? null : c.id)}
                  className="focus-ring w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="font-serif text-lg text-ink">{c.code}</span>
                    <span className="text-ink2 text-sm">{c.name}</span>
                  </span>
                  <span className="text-ink2 text-sm">{isOpen ? "−" : "+"}</span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4">
                    {c.lecturer && <p className="text-xs text-ink2 mb-2">{c.lecturer}</p>}
                    {c.notes && <p className="text-xs text-gold mb-3 border-l-2 border-gold pl-2">{c.notes}</p>}

                    {items.length === 0 ? (
                      <p className="text-sm text-ink2">No assessment items logged.</p>
                    ) : (
                      <ul className="divide-y divide-rule">
                        {items.map((e) => (
                          <li key={e.id} className="py-3">
                            <div className="flex items-baseline justify-between gap-2 flex-wrap">
                              <span className="text-ink font-medium">{e.title}</span>
                              <span className="text-xs font-mono text-ink2">
                                {e.weight ? `${e.weight} · ` : ""}
                                {new Date(e.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                {e.start_time ? ` ${e.start_time}` : ""}
                              </span>
                            </div>
                            {!e.confirmed && <span className="text-xs text-gold">unconfirmed — verify with lecturer</span>}
                            {e.notes && <p className="text-sm text-ink2 mt-1">{e.notes}</p>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
