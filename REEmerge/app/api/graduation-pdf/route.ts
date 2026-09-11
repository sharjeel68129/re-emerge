import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib";
import { CATEGORY_LABELS, CATEGORY_ORDER, Subtask, Task, TaskCategory } from "@/types/database";
import { periodLabel, taskDate } from "@/lib/periodLabel";

export const runtime = "nodejs";

function yearIndexOf(dateStr: string, startDate: Date | null): number {
  if (!startDate) return new Date(dateStr).getFullYear();
  const d = new Date(dateStr);
  const diffMs = d.getTime() - startDate.getTime();
  const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(1, Math.floor(diffYears) + 1);
}

function statusMark(task: Task): string {
  if (task.completed) return "[x]";
  if (task.failed) return "[F]";
  if (task.excused) return "[~]";
  return "[ ]";
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Note: no .eq("archived", false) here on purpose — the PDF is the
  // permanent record, so archived (i.e. resolved-and-past-due) tasks
  // are still included.
  const [{ data: profile }, { data: tasksData }, { data: subtaskData }, { data: semesterData }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
      supabase.from("subtasks").select("*").eq("user_id", user.id).order("order_index", { ascending: true }),
      supabase.from("semesters").select("*").eq("user_id", user.id).order("start_date", { ascending: true }),
    ]);

  const tasks = (tasksData as Task[]) ?? [];
  const allSubtasks = (subtaskData as Subtask[]) ?? [];
  const semesters = (semesterData as any[]) ?? [];
  const startDate = profile?.start_date ? new Date(profile.start_date) : null;

  const grouped = new Map<string, Map<TaskCategory, Task[]>>();
  for (const task of tasks) {
    const yearKey = startDate
      ? `Year ${yearIndexOf(taskDate(task), startDate)}`
      : `${yearIndexOf(taskDate(task), null)}`;
    if (!grouped.has(yearKey)) grouped.set(yearKey, new Map());
    const byCat = grouped.get(yearKey)!;
    if (!byCat.has(task.category)) byCat.set(task.category, []);
    byCat.get(task.category)!.push(task);
  }
  const yearKeys = Array.from(grouped.keys()).sort();

  const pdf = await PDFDocument.create();
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const mono = await pdf.embedFont(StandardFonts.Courier);

  const INK = rgb(0.125, 0.169, 0.212);
  const INK2 = rgb(0.29, 0.353, 0.4);
  const GOLD = rgb(0.663, 0.506, 0.184);
  const RUST = rgb(0.557, 0.267, 0.2);
  const MARGIN = 56;
  const PAGE_SIZE = PageSizes.Letter;

  let page = pdf.addPage(PAGE_SIZE);
  let { width, height } = page.getSize();
  let y = height - MARGIN;

  function newPage() {
    page = pdf.addPage(PAGE_SIZE);
    ({ width, height } = page.getSize());
    y = height - MARGIN;
  }
  function ensureSpace(needed: number) {
    if (y - needed < MARGIN) newPage();
  }
  function drawText(text: string, opts: { size: number; font: any; color?: any; x?: number; gap?: number }) {
    ensureSpace(opts.size + (opts.gap ?? 6));
    page.drawText(text, { x: opts.x ?? MARGIN, y, size: opts.size, font: opts.font, color: opts.color ?? INK });
    y -= opts.size + (opts.gap ?? 6);
  }

  // Cover
  drawText("Four-Year Record", { size: 28, font: serifBold, gap: 10 });
  if (profile?.program) drawText(profile.program, { size: 13, font: serif, color: INK2, gap: 4 });
  const rangeLabel = [
    profile?.start_date ? new Date(profile.start_date).toLocaleDateString() : null,
    profile?.target_graduation_date ? new Date(profile.target_graduation_date).toLocaleDateString() : null,
  ]
    .filter(Boolean)
    .join(" — ");
  if (rangeLabel) drawText(rangeLabel, { size: 11, font: mono, color: INK2, gap: 16 });

  const completedCount = tasks.filter((t) => t.completed).length;
  const failedCount = tasks.filter((t) => t.failed).length;
  const excusedCount = tasks.filter((t) => t.excused).length;
  drawText(
    `Generated ${new Date().toLocaleDateString()} · ${tasks.length} entries · ${completedCount} completed · ${failedCount} failed · ${excusedCount} excused`,
    { size: 10, font: mono, color: INK2, gap: 24 }
  );

  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 1, color: GOLD });
  y -= 24;

  if (tasks.length === 0) {
    drawText("No tasks were logged before this record was generated.", { size: 12, font: serif, color: INK2 });
  }

  for (const yearKey of yearKeys) {
    ensureSpace(40);
    drawText(yearKey, { size: 18, font: serifBold, gap: 14 });

    const byCat = grouped.get(yearKey)!;
    for (const cat of CATEGORY_ORDER) {
      const items = byCat.get(cat);
      if (!items || items.length === 0) continue;

      ensureSpace(24);
      drawText(CATEGORY_LABELS[cat], { size: 13, font: serifBold, color: INK2, gap: 8 });

      for (const task of items) {
        const mark = statusMark(task);
        const label = periodLabel(task.category, taskDate(task), semesters);
        const resolvedAt = task.completed_at ?? task.failed_at ?? task.excused_at;
        const resolvedStr = resolvedAt
          ? ` · ${task.completed ? "completed" : task.failed ? "failed" : "excused"} ${new Date(resolvedAt).toLocaleDateString()}`
          : "";
        const deadlineStr =
          task.deadline_mode === "single" && task.deadline
            ? ` · due ${new Date(task.deadline).toLocaleDateString()}`
            : "";
        const dateLine = label
          ? `     ${label}${deadlineStr}${resolvedStr}`
          : `     added ${new Date(task.created_at).toLocaleDateString()}${deadlineStr}${resolvedStr}`;

        ensureSpace(16);
        const titleColor = task.failed ? RUST : task.excused ? GOLD : INK;
        drawText(`${mark} ${task.title}`, { size: 11.5, font: serif, color: titleColor, gap: 2 });
        drawText(dateLine, { size: 8.5, font: mono, color: INK2, gap: 4 });

        if (task.task_type === "quantitative" && task.target_value) {
          ensureSpace(14);
          drawText(`     target: ${task.target_value}${task.result_value ? ` · result: ${task.result_value}` : ""}`, {
            size: 9.5,
            font: serif,
            color: INK2,
            gap: 6,
          });
        }

        if (task.notes) {
          ensureSpace(14);
          drawText(`     ${task.notes}`, { size: 9.5, font: serif, color: INK2, gap: 6 });
        }

        if (task.failed && task.failure_note) {
          ensureSpace(14);
          drawText(`     why: ${task.failure_note}`, { size: 9.5, font: serif, color: RUST, gap: 6 });
        }
        if (task.excused && task.excuse_note) {
          ensureSpace(14);
          drawText(`     circumstances: ${task.excuse_note}`, { size: 9.5, font: serif, color: GOLD, gap: 6 });
        }
        if (!task.completed && !task.failed && !task.excused && task.failure_note) {
          ensureSpace(14);
          drawText(`     note: ${task.failure_note}`, { size: 9.5, font: serif, color: GOLD, gap: 6 });
        }

        const kids = allSubtasks.filter((s) => s.task_id === task.id);
        for (const sub of kids) {
          ensureSpace(14);
          const subMark = sub.completed ? "[x]" : "[ ]";
          const subDeadline =
            task.deadline_mode === "per_subtask" && sub.deadline
              ? ` · due ${new Date(sub.deadline).toLocaleDateString()}`
              : "";
          drawText(`       ${subMark} ${sub.title}${subDeadline}`, { size: 9.5, font: serif, color: INK2, gap: 4 });
        }
        y -= 4;
      }
      y -= 6;
    }
    y -= 10;
  }

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="four-year-record.pdf"',
    },
  });
}
