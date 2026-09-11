import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib";
import { BASELINE, NamazLog, NamazQaza, PRAYER_LABELS, PRAYER_ORDER, Prayer } from "@/types/namaz";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const [{ data: logData }, { data: qazaData }] = await Promise.all([
    supabase.from("namaz_logs").select("*").eq("user_id", user.id).order("date", { ascending: true }),
    supabase.from("namaz_qaza").select("*").eq("user_id", user.id).order("prayed_at", { ascending: true }),
  ]);
  const logs = (logData as NamazLog[]) ?? [];
  const qazaEntries = (qazaData as NamazQaza[]) ?? [];

  type DayEvents = { logs: NamazLog[]; qaza: NamazQaza[] };
  const byDay = new Map<string, DayEvents>();
  for (const l of logs) {
    if (!byDay.has(l.date)) byDay.set(l.date, { logs: [], qaza: [] });
    byDay.get(l.date)!.logs.push(l);
  }
  for (const q of qazaEntries) {
    const key = q.prayed_at.slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, { logs: [], qaza: [] });
    byDay.get(key)!.qaza.push(q);
  }
  const days = Array.from(byDay.keys()).sort();

  const pdf = await PDFDocument.create();
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const mono = await pdf.embedFont(StandardFonts.Courier);
  const INK = rgb(0.125, 0.169, 0.212);
  const INK2 = rgb(0.29, 0.353, 0.4);
  const GOLD = rgb(0.663, 0.506, 0.184);
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

  drawText("Namaz Record", { size: 26, font: serifBold, gap: 10 });
  drawText(`Generated ${new Date().toLocaleDateString()}`, { size: 10, font: mono, color: INK2, gap: 20 });
  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 1, color: GOLD });
  y -= 20;

  if (days.length === 0) {
    drawText("No prayers logged yet.", { size: 12, font: serif, color: INK2 });
  }

  const running: Record<Prayer, number> = { ...BASELINE };

  for (let i = 0; i < days.length; i++) {
    const dateKey = days[i];
    const dayData = byDay.get(dateKey)!;
    ensureSpace(16);
    drawText(dateKey, { size: 11, font: serifBold, gap: 4 });

    for (const p of PRAYER_ORDER) {
      const log = dayData.logs.find((l) => l.prayer === p);
      if (!log) continue;
      if (log.status === "missed") running[log.prayer] -= 1;
      const mark = log.status === "prayed" ? "prayed" : log.excused ? "missed (excused)" : "missed";
      const color = log.status === "prayed" ? INK2 : log.excused ? GOLD : RUST;
      ensureSpace(12);
      drawText(`  ${PRAYER_LABELS[p]}: ${mark}${log.excuse_note ? ` — ${log.excuse_note}` : ""}`, {
        size: 9.5,
        font: serif,
        color,
        gap: 3,
      });
    }
    for (const q of dayData.qaza) {
      running[q.prayer] += 1;
      ensureSpace(12);
      drawText(`  qaza prayed: ${PRAYER_LABELS[q.prayer]}`, { size: 9.5, font: serif, color: INK2, gap: 3 });
    }

    const nextMonth = days[i + 1] ? days[i + 1].slice(0, 7) : null;
    const thisMonth = dateKey.slice(0, 7);
    if (nextMonth !== thisMonth) {
      ensureSpace(30);
      y -= 4;
      drawText(`End of ${thisMonth}`, { size: 10, font: serifBold, color: INK2, gap: 4 });
      const summary = PRAYER_ORDER.map((p) => `${PRAYER_LABELS[p]} ${running[p]}`).join("   ·   ");
      drawText(summary, { size: 9, font: mono, color: INK2, gap: 14 });
    }
  }

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="namaz-record.pdf"',
    },
  });
}
