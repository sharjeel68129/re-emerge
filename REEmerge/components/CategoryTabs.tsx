"use client";

import { CATEGORY_LABELS, CATEGORY_ORDER, TaskCategory } from "@/types/database";

export default function CategoryTabs({
  active,
  onChange,
  counts,
}: {
  active: TaskCategory;
  onChange: (c: TaskCategory) => void;
  counts: Record<TaskCategory, number>;
}) {
  return (
    <nav className="border-b border-rule">
      <ul className="flex flex-wrap">
        {CATEGORY_ORDER.map((cat) => {
          const isActive = cat === active;
          return (
            <li key={cat}>
              <button
                onClick={() => onChange(cat)}
                className={[
                  "focus-ring px-4 py-3 text-sm border-b-2 -mb-px transition-colors",
                  isActive
                    ? "border-gold text-ink font-medium"
                    : "border-transparent text-ink2 hover:text-ink",
                ].join(" ")}
              >
                {CATEGORY_LABELS[cat]}
                {counts[cat] > 0 && (
                  <span className="ml-2 font-mono text-xs text-ink2">
                    {counts[cat]}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
