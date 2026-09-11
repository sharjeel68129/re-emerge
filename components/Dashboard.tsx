"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import TopNav from "@/components/TopNav";
import {
  CATEGORY_ORDER,
  isResolved,
  Profile,
  Semester,
  Subtask,
  Task,
  TaskCategory,
} from "@/types/database";
import CategoryTabs from "@/components/CategoryTabs";
import AddTaskForm, { AddTaskPayload } from "@/components/AddTaskForm";
import TaskItem from "@/components/TaskItem";
import Celebration, { pickCelebrationLine } from "@/components/Celebration";
import GraduationButton from "@/components/GraduationButton";
import ProfileSetup from "@/components/ProfileSetup";
import SemesterManager from "@/components/SemesterManager";
import EditTaskModal, { TaskEdits } from "@/components/EditTaskModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { periodEnd, taskDate } from "@/lib/periodLabel";

export default function Dashboard({
  userId,
  email,
  profile,
}: {
  userId: string;
  email: string;
  profile: Profile | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<TaskCategory>("daily");
  const [celebration, setCelebration] = useState<string | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(profile);
  const [showProfileForm, setShowProfileForm] = useState(!profile?.start_date);
  const [showSemesterManager, setShowSemesterManager] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);

  const fetchAll = useCallback(async () => {
    const [{ data: taskData }, { data: subtaskData }, { data: semesterData }] = await Promise.all([
      supabase.from("tasks").select("*").eq("archived", false).order("order_index", { ascending: true }),
      supabase.from("subtasks").select("*").order("order_index", { ascending: true }),
      supabase.from("semesters").select("*").order("start_date", { ascending: true }),
    ]);

    const loadedTasks = (taskData as Task[]) ?? [];
    const loadedSemesters = (semesterData as Semester[]) ?? [];

    // Tasks created before reordering existed all share order_index = 0,
    // which makes the up/down buttons a no-op (swapping 0 with 0 changes
    // nothing). Give every task within a category a distinct index the
    // first time it's loaded, using created_at as the tiebreaker so the
    // order you're used to seeing doesn't jump around.
    const byCategory = new Map<string, Task[]>();
    for (const t of loadedTasks) {
      if (!byCategory.has(t.category)) byCategory.set(t.category, []);
      byCategory.get(t.category)!.push(t);
    }
    const renumberUpdates: { id: string; order_index: number }[] = [];
    for (const list of byCategory.values()) {
      const sorted = [...list].sort(
        (a, b) => a.order_index - b.order_index || a.created_at.localeCompare(b.created_at)
      );
      sorted.forEach((t, i) => {
        if (t.order_index !== i) {
          t.order_index = i;
          renumberUpdates.push({ id: t.id, order_index: i });
        }
      });
    }
    if (renumberUpdates.length > 0) {
      await Promise.all(
        renumberUpdates.map((u) => supabase.from("tasks").update({ order_index: u.order_index }).eq("id", u.id))
      );
    }

    // Sweep for anything resolved whose period has already ended, and
    // archive it now (hidden from view, but never deleted — the PDF
    // still pulls archived tasks too).
    const toArchive = loadedTasks.filter((t) => {
      if (!isResolved(t)) return false;
      const end = periodEnd(t.category, taskDate(t), loadedSemesters);
      return end !== null && Date.now() > end.getTime();
    });
    if (toArchive.length > 0) {
      await supabase.from("tasks").update({ archived: true }).in("id", toArchive.map((t) => t.id));
    }
    const archivedIds = new Set(toArchive.map((t) => t.id));

    setTasks(loadedTasks.filter((t) => !archivedIds.has(t.id)));
    setSubtasks((subtaskData as Subtask[]) ?? []);
    setSemesters(loadedSemesters);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const visible = tasks.filter((t) => t.category === active);
  const counts = CATEGORY_ORDER.reduce((acc, cat) => {
    acc[cat] = tasks.filter((t) => t.category === cat && !isResolved(t)).length;
    return acc;
  }, {} as Record<TaskCategory, number>);

  async function addTask(payload: AddTaskPayload) {
    const inCategory = tasks.filter((t) => t.category === active);
    const nextOrder = inCategory.length > 0 ? Math.max(...inCategory.map((t) => t.order_index)) + 1 : 0;

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        category: active,
        title: payload.title,
        notes: payload.notes,
        effective_date: payload.effectiveDate,
        deadline: payload.subtasks.length > 0 && payload.deadlineMode === "per_subtask" ? null : payload.deadline,
        deadline_mode: payload.deadlineMode,
        task_type: payload.taskType,
        target_value: payload.targetValue,
        order_index: nextOrder,
      })
      .select()
      .single();

    if (error || !data) return;
    const newTask = data as Task;

    if (payload.subtasks.length > 0) {
      const rows = payload.subtasks.map((s, i) => ({
        task_id: newTask.id,
        user_id: userId,
        title: s.title,
        deadline: payload.deadlineMode === "per_subtask" ? s.deadline : null,
        order_index: i,
      }));
      const { data: subData } = await supabase.from("subtasks").insert(rows).select();
      if (subData) setSubtasks((prev) => [...prev, ...(subData as Subtask[])]);
    }

    setTasks((prev) => [...prev, newTask]);
  }

  async function toggleTask(task: Task) {
    const nextCompleted = !task.completed;
    const { data, error } = await supabase
      .from("tasks")
      .update({
        completed: nextCompleted,
        completed_at: nextCompleted ? new Date().toISOString() : null,
        failed: false,
        failed_at: null,
        excused: false,
        excused_at: null,
      })
      .eq("id", task.id)
      .select()
      .single();
    if (!error && data) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? (data as Task) : t)));
      if (nextCompleted) setCelebration(pickCelebrationLine());
    }
  }

  async function toggleSubtask(subtask: Subtask, task: Task) {
    const nextCompleted = !subtask.completed;
    const { data, error } = await supabase
      .from("subtasks")
      .update({ completed: nextCompleted, completed_at: nextCompleted ? new Date().toISOString() : null })
      .eq("id", subtask.id)
      .select()
      .single();
    if (error || !data) return;

    const updatedSubtask = data as Subtask;
    const siblings = subtasks.map((s) => (s.id === subtask.id ? updatedSubtask : s)).filter((s) => s.task_id === task.id);
    setSubtasks((prev) => prev.map((s) => (s.id === subtask.id ? updatedSubtask : s)));

    const allDone = siblings.length > 0 && siblings.every((s) => s.completed);
    if (allDone !== task.completed) {
      const { data: taskData } = await supabase
        .from("tasks")
        .update({ completed: allDone, completed_at: allDone ? new Date().toISOString() : null })
        .eq("id", task.id)
        .select()
        .single();
      if (taskData) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? (taskData as Task) : t)));
        if (allDone) setCelebration(pickCelebrationLine());
      }
    }
  }

  async function logResult(task: Task, resultValue: string, met: boolean) {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        result_value: resultValue || null,
        completed: met,
        completed_at: met ? new Date().toISOString() : null,
      })
      .eq("id", task.id)
      .select()
      .single();
    if (!error && data) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? (data as Task) : t)));
      if (met) setCelebration(pickCelebrationLine());
    }
  }

  async function failTask(task: Task, note: string) {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        failed: true,
        failed_at: new Date().toISOString(),
        failure_note: note || null,
        completed: false,
        completed_at: null,
        excused: false,
        excused_at: null,
      })
      .eq("id", task.id)
      .select()
      .single();
    if (!error && data) setTasks((prev) => prev.map((t) => (t.id === task.id ? (data as Task) : t)));
  }

  async function excuseTask(task: Task, note: string) {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        excused: true,
        excused_at: new Date().toISOString(),
        excuse_note: note || null,
        completed: false,
        completed_at: null,
        failed: false,
        failed_at: null,
      })
      .eq("id", task.id)
      .select()
      .single();
    if (!error && data) setTasks((prev) => prev.map((t) => (t.id === task.id ? (data as Task) : t)));
  }

  async function moveTask(task: Task, direction: -1 | 1) {
    const inCategory = tasks
      .filter((t) => t.category === task.category)
      .sort((a, b) => a.order_index - b.order_index);
    const index = inCategory.findIndex((t) => t.id === task.id);
    const swapWith = inCategory[index + direction];
    if (!swapWith) return;

    const a = { id: task.id, order_index: swapWith.order_index };
    const b = { id: swapWith.id, order_index: task.order_index };

    await Promise.all([
      supabase.from("tasks").update({ order_index: a.order_index }).eq("id", a.id),
      supabase.from("tasks").update({ order_index: b.order_index }).eq("id", b.id),
    ]);

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === a.id) return { ...t, order_index: a.order_index };
        if (t.id === b.id) return { ...t, order_index: b.order_index };
        return t;
      })
    );
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const { error } = await supabase.from("tasks").delete().eq("id", pendingDelete.id);
    if (!error) setTasks((prev) => prev.filter((t) => t.id !== pendingDelete.id));
    setPendingDelete(null);
  }

  async function saveEdit(updates: TaskEdits) {
    if (!editingTask) return;
    const { data, error } = await supabase.from("tasks").update(updates).eq("id", editingTask.id).select().single();
    if (!error && data) {
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? (data as Task) : t)));
      setEditingTask(null);
    }
  }

  const sortedVisible = [...visible].sort((a, b) => a.order_index - b.order_index);

  return (
    <main className="min-h-screen max-w-4xl mx-auto px-6 py-10">
      <TopNav active="task" />
      {showProfileForm ? (
        <ProfileSetup
          userId={userId}
          profile={currentProfile}
          onSaved={(p) => {
            setCurrentProfile(p);
            setShowProfileForm(false);
          }}
        />
      ) : (
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-ink2 font-mono">
            {currentProfile?.program ?? "no program set"} · since {currentProfile?.start_date ?? "—"}
          </p>
          <button onClick={() => setShowProfileForm(true)} className="focus-ring text-xs text-ink2 hover:text-ink underline underline-offset-2">
            edit program dates
          </button>
        </div>
      )}

      <CategoryTabs active={active} onChange={setActive} counts={counts} />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        {/* Tasks — main column, shown first */}
        <div className="order-2 lg:order-1">
          {loading ? (
            <p className="text-ink2 text-sm">Loading…</p>
          ) : sortedVisible.length === 0 ? (
            <p className="text-ink2 text-sm py-6 text-center border border-dashed border-rule">
              Nothing here yet. Add the first thing you're trying to do this {active.replace("_", " ")}.
            </p>
          ) : (
            <ul>
              {sortedVisible.map((task, i) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  subtasks={subtasks.filter((s) => s.task_id === task.id)}
                  semesters={semesters}
                  isFirst={i === 0}
                  isLast={i === sortedVisible.length - 1}
                  onToggle={toggleTask}
                  onDelete={setPendingDelete}
                  onEdit={setEditingTask}
                  onMoveUp={(t) => moveTask(t, -1)}
                  onMoveDown={(t) => moveTask(t, 1)}
                  onToggleSubtask={toggleSubtask}
                  onLogResult={logResult}
                  onFail={failTask}
                  onExcuse={excuseTask}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Add options — right column */}
        <div className="order-1 lg:order-2 space-y-4">
          {active === "semester" && (
            <div>
              <button
                onClick={() => setShowSemesterManager((v) => !v)}
                className="focus-ring text-xs text-ink2 hover:text-ink underline underline-offset-2"
              >
                {showSemesterManager ? "hide" : "manage"} semester dates
              </button>
              {showSemesterManager && (
                <div className="mt-2">
                  <SemesterManager userId={userId} semesters={semesters} onChange={setSemesters} />
                </div>
              )}
            </div>
          )}
          <AddTaskForm category={active} semesters={semesters} onAdd={addTask} />
        </div>
      </div>

      <footer className="mt-12 pt-6 border-t border-rule">
        <GraduationButton userId={userId} />
      </footer>

      <Celebration message={celebration} onDone={() => setCelebration(null)} />

      {editingTask && <EditTaskModal task={editingTask} onSave={saveEdit} onCancel={() => setEditingTask(null)} />}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete this task?"
          message={`"${pendingDelete.title}" will be permanently removed — it won't appear in your graduation record either.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </main>
  );
}
