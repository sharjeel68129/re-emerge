"use client";

import Link from "next/link";

export default function TopNav({ active }: { active: "task" | "namaz" | "calendar" | "study" }) {
  const btn = (isActive: boolean) =>
    [
      "focus-ring font-serif text-base px-2.5 py-1.5 border transition-colors",
      isActive ? "bg-ink text-paper border-ink" : "text-ink border-rule hover:bg-white/50",
    ].join(" ");

  return (
    <header className="flex items-center justify-between mb-8 gap-2 flex-wrap">
      <div className="flex gap-2 flex-wrap">
        <Link href="/" className={btn(active === "task")}>RE:Task</Link>
        <Link href="/namaz" className={btn(active === "namaz")}>RE:Namaz</Link>
        <Link href="/calendar" className={btn(active === "calendar")}>RE:Calendar</Link>
        <Link href="/study" className={btn(active === "study")}>RE:Study</Link>
      </div>
      <Link
        href="/settings"
        className="focus-ring text-sm text-ink2 hover:text-ink border border-rule px-3 py-1.5 hover:bg-white/50 transition-colors"
      >
        Settings
      </Link>
    </header>
  );
}
