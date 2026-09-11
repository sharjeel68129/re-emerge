export interface SeedEvent {
  type: "class" | "assessment" | "deadline" | "other";
  title: string;
  date: string;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  weight?: string | null;
  notes?: string | null;
  confirmed?: boolean;
}

export interface SeedCourse {
  code: string;
  name: string;
  color: string;
  lecturer?: string | null;
  notes?: string | null;
  events: SeedEvent[];
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
function toLocalISO(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function weeklyDates(startISO: string, totalWeeks: number, skipWeeks: number[] = []): string[] {
  const start = new Date(startISO + "T00:00:00");
  const dates: string[] = [];
  for (let w = 1; w <= totalWeeks; w++) {
    if (skipWeeks.includes(w)) continue;
    const d = new Date(start);
    d.setDate(start.getDate() + (w - 1) * 7);
    dates.push(toLocalISO(d));
  }
  return dates;
}

const AMA1702_LEC = [
  "2026-09-02", "2026-09-09", "2026-09-16", "2026-09-23", "2026-09-30",
  "2026-10-07", "2026-10-14", "2026-10-21", "2026-10-28", "2026-11-04",
  "2026-11-11", "2026-11-18", "2026-11-25", "2026-12-02",
];

const CMS1000_LEC = ["2026-09-01", "2026-09-08", "2026-09-15", "2026-09-22", "2026-09-29", "2026-10-06", "2026-10-13"];

const COMP1010_LEC = weeklyDates("2026-08-31", 13);
const COMP1010_LAB = weeklyDates("2026-09-11", 12);

const DSAI1202_LEC = weeklyDates("2026-08-31", 13, [8, 12]);

export const SEED_COURSES: SeedCourse[] = [
  {
    code: "AMA1702",
    name: "Calculus",
    color: "#2E6F95",
    lecturer: "Dr. Yao Fangyan (fangyan.yao@polyu.edu.hk)",
    notes:
      "Tutorial section not yet chosen (4 options, 50 min each). Weekly exercises Ex.1-13 (12 counted, none in midterm week) are 10% total, given in lecture, no fixed per-exercise deadline given.",
    events: [
      ...AMA1702_LEC.map((date, i) => ({
        type: "class" as const,
        title: i === 13 ? "Q&A / Review / Make-up" : `Lecture ${i + 1}`,
        date,
        start_time: "08:30",
        end_time: "10:20",
        location: "Z205",
      })),
      {
        type: "deadline",
        title: "Assignment 1 due",
        date: "2026-10-18",
        weight: "part of 10%",
        notes: "Upload scanned written answers to Blackboard by 23:59.",
        confirmed: false,
      },
      {
        type: "deadline",
        title: "Assignment 2 due",
        date: "2026-11-29",
        weight: "part of 10%",
        notes: "Upload scanned written answers to Blackboard by 23:59.",
        confirmed: false,
      },
      {
        type: "assessment",
        title: "Midterm Test",
        date: "2026-10-25",
        start_time: "09:30",
        end_time: "11:00",
        weight: "20%",
        notes:
          "Open book: 1 A4 sheet, handwritten both sides. Covers functions/inverse functions through L'Hopital's rule. Scientific/financial calculator only.",
      },
      {
        type: "assessment",
        title: "Final Examination",
        date: "2026-12-10",
        weight: "60%",
        notes:
          "Exam period Dec 3-18, exact date TBD by AR. Same booklet type as midterm; formula sheet provided; 1 A4 open-book cheat sheet allowed.",
        confirmed: false,
      },
    ],
  },
  {
    code: "APSS1L01",
    name: "Tomorrow's Leaders",
    color: "#7A4FA3",
    notes: "Weekly lecture day/time not confirmed from documents — add once known.",
    events: [
      { type: "deadline", title: "L2L Assignment 1 due", date: "2026-09-18", weight: "2%" },
      { type: "deadline", title: "Academic Integrity online module (pass/fail)", date: "2026-10-02", weight: "Pass/Fail" },
      { type: "deadline", title: "L2L Assignment 2 due", date: "2026-10-16", weight: "3%" },
      {
        type: "assessment",
        title: "Group Presentation",
        date: "2026-11-20",
        weight: "30%",
        notes: "In-class, Week 12/13. 20-25 min + 8-10 min Q&A. Public figure demonstrating effective leadership; apply course theories.",
        confirmed: false,
      },
      {
        type: "deadline",
        title: "Term Paper due",
        date: "2026-12-04",
        weight: "45%",
        notes: "1,500+ words, 2 parts (~750 each). Submit via Turnitin. Late = one sub-grade deducted per day without prior approval.",
        confirmed: false,
      },
      { type: "deadline", title: "Quiz on NSL (pass/fail, 16/20 needed)", date: "2026-12-20", weight: "Pass/Fail" },
    ],
  },
  {
    code: "CMS1000",
    name: "Computer and Mathematical Sciences Professionals in Society",
    color: "#B8860B",
    notes: "Quizzes (best 5 of 6, 60% total) run after each guest seminar — electronic, timed, no aids, zero if absent, no make-ups.",
    events: [
      { type: "class", title: "Intro / welcome", date: "2026-09-01", start_time: "18:30", end_time: "19:20", location: "Z209 (Z208 overflow)" },
      { type: "class", title: "Guest seminar 1: Software Engineering", date: "2026-09-08", start_time: "18:30", end_time: "20:20", location: "Z209 (Z208 overflow)" },
      { type: "class", title: "Guest seminar 2: Architect to AI", date: "2026-09-15", start_time: "18:30", end_time: "20:20", location: "Z209 (Z208 overflow)" },
      { type: "class", title: "Guest seminar 3: STEM Education", date: "2026-09-22", start_time: "18:30", end_time: "20:20", location: "Z209 (Z208 overflow)" },
      { type: "class", title: "Guest seminar 4: Statistics and Society", date: "2026-09-29", start_time: "18:30", end_time: "20:20", location: "Z209 (Z208 overflow)" },
      { type: "class", title: "AI Workshop: Vibe Coding (bring laptop/tablet)", date: "2026-10-06", start_time: "18:30", end_time: "20:20", location: "Z209 (Z208 overflow)" },
      { type: "class", title: "Guest seminar 5: Innovation & Control Disciplines", date: "2026-10-13", start_time: "18:30", end_time: "20:20", location: "Z209 (Z208 overflow)" },
      { type: "class", title: "Faculty briefing: major selection", date: "2026-11-17", start_time: "18:30", end_time: "20:20", location: "Z209 (Z208 overflow)" },
      {
        type: "deadline",
        title: "Advisor interview report due (group)",
        date: "2026-11-20",
        weight: "20%",
        notes: "800-1000 words, English, .docx, filename group_[NN].docx. Submit via Turnitin + AI declaration form.",
      },
      {
        type: "deadline",
        title: "Personal development plan due (individual)",
        date: "2026-11-20",
        weight: "20%",
        notes: "500-800 words, .docx, filename [surname]_[given name].docx. No images/tables/charts.",
      },
    ],
  },
  {
    code: "COMP1010",
    name: "Computational Thinking and Problem Solving",
    color: "#3F5C46",
    lecturer: "Muhammad Tayyab (muhammad.tayyab@connect.polyu.hk)",
    notes: "Section 010S03. Office hours: Wed 11-12, Thu 13-15, PQ733.",
    events: [
      ...COMP1010_LEC.map((date, i) => ({
        type: "class" as const,
        title: `Lecture ${i + 1}`,
        date,
        start_time: "16:30",
        end_time: "18:20",
        location: "TU101",
        confirmed: date !== "2026-10-19",
        notes: date === "2026-10-19" ? "Public holiday — alternate arrangement TBD" : undefined,
      })),
      ...COMP1010_LAB.map((date, i) => ({
        type: "class" as const,
        title: `Lab ${i + 1}`,
        date,
        start_time: "10:30",
        end_time: "11:20",
        location: "PQ604A/B/C, PQ603",
      })),
      { type: "assessment", title: "Quiz 1", date: "2026-09-28", weight: "5%" },
      { type: "deadline", title: "Assignment released", date: "2026-11-02", weight: "10%" },
      { type: "assessment", title: "Quiz 2", date: "2026-11-16", weight: "15%" },
      { type: "deadline", title: "Assignment due", date: "2026-11-16", weight: "part of 10% above" },
      {
        type: "assessment",
        title: "Final Examination",
        date: "2026-12-10",
        weight: "70%",
        notes: "Open book. Exam period Dec 3-18, exact date TBD.",
        confirmed: false,
      },
    ],
  },
  {
    code: "DSAI1202",
    name: "Introduction to AI and Data Analytics",
    color: "#9B4A32",
    lecturer: "Dr. Mingsong Lyu (mingsong.lyu@polyu.edu.hk)",
    notes: "Section LEC008 (Mon 08:30, Z207). Group A/B for IC visits not yet chosen — Group A dates seeded below.",
    events: [
      ...DSAI1202_LEC.map((date) => ({
        type: "class" as const,
        title: "Lecture",
        date,
        start_time: "08:30",
        end_time: "10:20",
        location: date === "2026-10-12" ? "HJ202" : "Z207",
      })),
      {
        type: "other",
        title: "IC Visit 1 (Group A)",
        date: "2026-10-07",
        start_time: "11:30",
        end_time: "13:30",
        location: "U301, W311A",
        weight: "part of 5%",
        notes: "Group B alternative: Oct 14, same time.",
        confirmed: false,
      },
      {
        type: "other",
        title: "IC Visit 2 (Group A)",
        date: "2026-11-11",
        start_time: "11:30",
        end_time: "13:30",
        location: "W402-Z2, W402A, W311A",
        weight: "part of 5%",
        notes: "Group B alternative: Nov 18, same time.",
        confirmed: false,
      },
      { type: "deadline", title: "AIDA e-Module online test (>=65%)", date: "2026-10-17", weight: "4%" },
      { type: "deadline", title: "GenAI Class Exercise", date: "2026-10-17", weight: "6%" },
      {
        type: "deadline",
        title: "Project (details TBD)",
        date: "2026-12-01",
        weight: "25%",
        notes: "Runs Week 5-13, exact deliverable/deadline TBD by lecturer.",
        confirmed: false,
      },
      {
        type: "assessment",
        title: "Final Test",
        date: "2026-11-23",
        start_time: "08:30",
        end_time: "09:10",
        weight: "60%",
        notes: "In-class, ~40 min, closed-book, paper-based. MC/MA/TF/short answer. Phones off and bagged.",
      },
    ],
  },
  {
    code: "AITLL-ELC",
    name: "AITLL English Language Component",
    color: "#4A7A8C",
    notes:
      "Subject code and weekly class day/time not confirmed — update once known. Relative deadlines: Digital Poster (20%) due 24h before Wk6 class; 3 Reflective Logs + learning plan (30%) due 30min before Wk6 class, in-class discussion during Wk6; Essay v1 due day before Wk9; Essay v3 (final) due via Turnitin by start of Wk12; Digital Process Output due day before Wk13.",
    events: [
      { type: "deadline", title: "Essay Portfolio v2 due", date: "2026-11-08", start_time: "23:59", weight: "part of 50%" },
    ],
  },
];
