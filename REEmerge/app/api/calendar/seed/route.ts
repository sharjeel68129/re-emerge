import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SEED_COURSES } from "@/lib/courseSeedData";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  for (const c of SEED_COURSES) {
    const { data: course, error: courseErr } = await supabase
      .from("courses")
      .upsert(
        { user_id: user.id, code: c.code, name: c.name, color: c.color, lecturer: c.lecturer ?? null, notes: c.notes ?? null },
        { onConflict: "user_id,code" }
      )
      .select()
      .single();
    if (courseErr || !course) continue;

    await supabase.from("course_events").delete().eq("course_id", course.id);

    const rows = c.events.map((e) => ({
      user_id: user.id,
      course_id: course.id,
      type: e.type,
      title: e.title,
      date: e.date,
      start_time: e.start_time ?? null,
      end_time: e.end_time ?? null,
      location: e.location ?? null,
      weight: e.weight ?? null,
      notes: e.notes ?? null,
      confirmed: e.confirmed ?? true,
    }));
    if (rows.length > 0) await supabase.from("course_events").insert(rows);
  }

  return NextResponse.json({ ok: true, courses: SEED_COURSES.length });
}
