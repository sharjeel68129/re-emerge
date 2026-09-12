import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib";
import { Habit, HabitLog } from "@/types/habit";
import { repetitionLabel } from "@/lib/habit";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const [{ data: habitData }, { data: logData }] = await Promise.all([
    supabase.from("habits").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
    supabase.from("habit_logs").select("*").eq("user_id", user.id).order("due_date", { ascending: true }),
  ]);
  const habits = (habitData as Habit[]) ?? [];
  const logs = (logData as HabitLog[]) ?? [];

  const pdf = await PDFDocument.create();
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const mono = await pdf.embedFont(StandardFonts.Courier);
  const INK = rgb(0.125, 0.169, 0.212);
  const INK2 = rgb(0.29, 0.353, 0.4);
  const GOLD = rgb(0.663, 0.506, 0.184);
  const MOSS = rgb(0.247, 0.361, 0.275);
  const RUST = rgb(0.557, 0.267, 0.2);
  const MARGIN = 56;

  let page = pdf.addPage(PageSizes.Letter);
  let { width, height } = page.getSize();
  let y = height - MARGIN;
  function newPage() {
    page = pdf.addPage(PageSizes.Letter);
    ({ width, height } = page.getSize());
    y = height - MARGIN;
  }
  function ensureSpace(needed: number) {
    if (y - needed < MARGIN) newPage();
  }
  function drawText(text: string, opts: { size: number; font: any; color?: any; gap?: number }) {
    ensureSpace(opts.size + (opts.gap ?? 6));
    page.drawText(text, { x: MARGIN, y, size: opts.size, font: opts.font, color: opts.color ?? INK });
    y -= opts.size + (opts.gap ?? 6);
  }

  drawText("Habit Record", { size: 26, font: serifBold, gap: 10 });
  drawText(`Generated ${new Date().toLocaleDateString()}`, { size: 10, font: mono, color: INK2, gap: 20 });
  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 1, color: GOLD });
  y -= 20;

  if (habits.length === 0) {
    drawText("No habits logged yet.", { size: 12, font: serif, color: INK2 });
  }

  for (const habit of habits) {
    const habitLogs = logs.filter((l) => l.habit_id === habit.id).sort((a, b) => a.due_date.localeCompare(b.due_date));
    const doneCount = habitLogs.filter((l) => l.status === "done").length;
    const missedCount = habitLogs.filter((l) => l.status === "missed").length;

    ensureSpace(40);
    drawText(habit.name, { size: 16, font: serifBold, gap: 3 });
    drawText(
      `${repetitionLabel(habit.interval_days)} · since ${habit.start_date} · ${doneCount} done, ${missedCount} missed`,
      { size: 9.5, font: mono, color: INK2, gap: 4 }
    );
    if (habit.details) {
      drawText(habit.details, { size: 9.5, font: serif, color: INK2, gap: 10 });
    } else {
      y -= 6;
    }

    if (habitLogs.length === 0) {
      drawText("  No occurrences recorded yet.", { size: 9.5, font: serif, color: INK2, gap: 14 });
    } else {
      for (const log of habitLogs) {
        ensureSpace(12);
        const mark = log.status === "done" ? "[x] done" : "[ ] missed";
        const color = log.status === "done" ? MOSS : RUST;
        drawText(`  ${log.due_date} — ${mark}`, { size: 9.5, font: serif, color, gap: 3 });
      }
      y -= 10;
    }
  }

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="habit-record.pdf"',
    },
  });
}
