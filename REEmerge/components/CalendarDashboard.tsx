"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Course, CourseEvent, EVENT_TYPE_LABELS } from "@/types/calendar";
import TopNav from "@/components/TopNav";
import ConfirmDialog from "@/components/ConfirmDialog";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function iso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function todayISO() {
  return iso(new Date());
}

export default function CalendarDashboard({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<CourseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [pendingDelete, setPendingDelete] = useState<CourseEvent | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const fetchAll = useCallback(async () => {
    const [{ data: c }, { data: e }] = await Promise.all([
      supabase.from("courses").select("*").order("code", { ascending: true }),
      supabase.from("course_events").select("*").order("date", { ascending: true }),
    ]);
    setCourses((c as Course[]) ?? []);
    setEvents((e as CourseEvent[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const courseById = useMemo(() => {
    const m = new Map<string, Course>();
    for (const c of courses) m.set(c.id, c);
    return m;
  }, [courses]);

  const eventsByDate = useMemo(() => {
    const m = new Map<string, CourseEvent[]>();
    for (const e of events) {
      if (!m.has(e.date)) m.set(e.date, []);
      m.get(e.date)!.push(e);
    }
    return m;
  }, [events]);

  async function runSeed() {
    setSeeding(true);
    const res = await fetch("/api/calendar/seed", { method: "POST" });
    setSeeding(false);
    if (res.ok) fetchAll();
  }

  async function deleteEvent() {
    if (!pendingDelete) return;
    const { error } = await supabase.from("course_events").delete().eq("id", pendingDelete.id);
    if (!error) setEvents((prev) => prev.filter((e) => e.id !== pendingDelete.id));
    setPendingDelete(null);
  }

  // Month grid
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-first grid
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(iso(new Date(year, month, d)));

  const selectedEvents = (eventsByDate.get(selectedDate) ?? []).sort((a, b) =>
    (a.start_time ?? "").localeCompare(b.start_time ?? "")
  );

  return (
    <main className="min-h-screen max-w-4xl mx-auto px-6 py-10">
      <TopNav active="calendar" />

      {courses.length === 0 && !loading && (
        <div className="border border-gold/60 bg-gold/5 p-4 mb-6">
          <p className="text-sm text-ink mb-2">No courses imported yet.</p>
          <button
            onClick={runSeed}
            disabled={seeding}
            className="focus-ring bg-ink text-paper text-sm px-4 py-1.5 hover:bg-ink2 disabled:opacity-50"
          >
            {seeding ? "Importing…" : "Import my 6 courses"}
          </button>
        </div>
      )}
      {courses.length > 0 && (
        <button
          onClick={runSeed}
          disabled={seeding}
          className="focus-ring text-xs text-ink2 hover:text-ink underline underline-offset-2 mb-4"
        >
          {seeding ? "Refreshing…" : "re-import / refresh course data"}
        </button>
      )}

      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMonthCursor(new Date(year, month - 1, 1))} className="focus-ring text-ink2 hover:text-ink px-2">←</button>
        <h2 className="font-serif text-xl text-ink">{monthCursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2>
        <button onClick={() => setMonthCursor(new Date(year, month + 1, 1))} className="focus-ring text-ink2 hover:text-ink px-2">→</button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-rule border border-rule mb-6 text-xs">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="bg-white/60 text-center py-1 text-ink2 font-mono">{d}</div>
        ))}
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={i} className="bg-paper" />;
          const dayEvents = eventsByDate.get(dateStr) ?? [];
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayISO();
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(dateStr)}
              className={[
                "bg-white/40 hover:bg-white/70 text-left p-1 min-h-[64px] flex flex-col transition-colors",
                isSelected ? "ring-2 ring-inset ring-gold" : "",
              ].join(" ")}
            >
              <span className={["text-xs font-mono", isToday ? "text-gold font-bold" : "text-ink2"].join(" ")}>
                {Number(dateStr.slice(8, 10))}
              </span>
              <div className="flex flex-wrap gap-0.5 mt-1">
                {dayEvents.slice(0, 4).map((e) => (
                  <span
                    key={e.id}
                    title={e.title}
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: courseById.get(e.course_id)?.color ?? "#999" }}
                  />
                ))}
                {dayEvents.length > 4 && <span className="text-[9px] text-ink2">+{dayEvents.length - 4}</span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="border border-rule bg-white/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-lg text-ink">{new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</h3>
          <button onClick={() => setShowAdd((v) => !v)} className="focus-ring text-xs text-ink2 hover:text-ink underline underline-offset-2">
            {showAdd ? "cancel" : "+ add event"}
          </button>
        </div>

        {showAdd && (
          <AddEventForm
            userId={userId}
            courses={courses}
            date={selectedDate}
            onAdded={(e) => {
              setEvents((prev) => [...prev, e]);
              setShowAdd(false);
            }}
          />
        )}

        {selectedEvents.length === 0 ? (
          <p className="text-ink2 text-sm">Nothing on this day.</p>
        ) : (
          <ul className="divide-y divide-rule">
            {selectedEvents.map((e) => {
              const course = courseById.get(e.course_id);
              return (
                <li key={e.id} className="py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block h-2 w-2 rounded-full mr-2" style={{ backgroundColor: course?.color }} />
                      <span className="text-ink">{e.title}</span>
                      <span className="text-xs text-ink2 ml-2 font-mono">{course?.code} · {EVENT_TYPE_LABELS[e.type]}</span>
                      {!e.confirmed && <span className="text-xs text-gold ml-2">unconfirmed</span>}
                    </div>
                    <button onClick={() => setPendingDelete(e)} className="focus-ring text-ink2 hover:text-rust text-xs shrink-0">✕</button>
                  </div>
                  <p className="text-xs text-ink2 font-mono mt-0.5">
                    {e.start_time && `${e.start_time}${e.end_time ? `–${e.end_time}` : ""}`} {e.location} {e.weight && `· ${e.weight}`}
                  </p>
                  {e.notes && <p className="text-xs text-ink2 mt-1">{e.notes}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="Delete this event?"
          message={`"${pendingDelete.title}" will be permanently removed.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setPendingDelete(null)}
          onConfirm={deleteEvent}
        />
      )}
    </main>
  );
}

function AddEventForm({
  userId,
  courses,
  date,
  onAdded,
}: {
  userId: string;
  courses: Course[];
  date: string;
  onAdded: (e: CourseEvent) => void;
}) {
  const supabase = createClient();
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [type, setType] = useState<CourseEvent["type"]>("other");
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [location, setLocation] = useState("");
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !courseId) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("course_events")
      .insert({
        user_id: userId,
        course_id: courseId,
        type,
        title: title.trim(),
        date,
        start_time: startTime || null,
        location: location.trim() || null,
        weight: weight.trim() || null,
      })
      .select()
      .single();
    setSaving(false);
    if (!error && data) onAdded(data as CourseEvent);
  }

  if (courses.length === 0) return <p className="text-xs text-ink2 mb-3">Import courses first, or add one manually via SQL.</p>;

  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-2 mb-4 text-sm">
      <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="focus-ring border border-rule bg-white/60 px-2 py-1 col-span-2">
        {courses.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
      </select>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="focus-ring border border-rule bg-white/60 px-2 py-1 col-span-2" />
      <select value={type} onChange={(e) => setType(e.target.value as CourseEvent["type"])} className="focus-ring border border-rule bg-white/60 px-2 py-1">
        <option value="class">Class</option>
        <option value="assessment">Assessment</option>
        <option value="deadline">Deadline</option>
        <option value="other">Other</option>
      </select>
      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="focus-ring border border-rule bg-white/60 px-2 py-1 font-mono" />
      <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="focus-ring border border-rule bg-white/60 px-2 py-1" />
      <input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Weight (e.g. 20%)" className="focus-ring border border-rule bg-white/60 px-2 py-1" />
      <button type="submit" disabled={saving || !title.trim()} className="focus-ring col-span-2 bg-ink text-paper py-1.5 hover:bg-ink2 disabled:opacity-50">
        {saving ? "Adding…" : "Add"}
      </button>
    </form>
  );
}
