// View logic: which tasks show up in "Idag", "Kommande", "Inkorg" etc., how
// they're ordered, and the badge counts in the sidebar. All pure functions of
// (tasks, now) so they're easy to test and reason about.

import type { Task } from "./types";
import { todayISO, daysBetween, isOverdue } from "./date";

export type View =
  | { kind: "today" }
  | { kind: "upcoming" }
  | { kind: "inbox" }
  | { kind: "all" }
  | { kind: "completed" }
  | { kind: "project"; id: string }
  | { kind: "tag"; name: string };

/** Highest priority first, then earliest due, then manual order, then age. */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate)
      return a.dueDate < b.dueDate ? -1 : 1;
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    if (a.order !== b.order) return a.order - b.order;
    return a.createdAt - b.createdAt;
  });
}

function matchesView(task: Task, view: View, now: Date): boolean {
  switch (view.kind) {
    case "today":
      // Due today, or overdue and still open — the classic "what's on my plate".
      return !task.completed && task.dueDate !== null &&
        daysBetween(todayISO(now), task.dueDate) <= 0;
    case "upcoming":
      return !task.completed && task.dueDate !== null &&
        daysBetween(todayISO(now), task.dueDate) > 0;
    case "inbox":
      return !task.completed && task.projectId === null;
    case "all":
      return !task.completed;
    case "completed":
      return task.completed;
    case "project":
      return !task.completed && task.projectId === view.id;
    case "tag":
      return !task.completed && task.tags.includes(view.name);
  }
}

export function viewTasks(tasks: Task[], view: View, now: Date): Task[] {
  return sortTasks(tasks.filter((t) => matchesView(t, view, now)));
}

export interface Counts {
  today: number;
  upcoming: number;
  inbox: number;
  all: number;
  overdue: number;
}

export function counts(tasks: Task[], now: Date): Counts {
  return {
    today: tasks.filter((t) => matchesView(t, { kind: "today" }, now)).length,
    upcoming: tasks.filter((t) => matchesView(t, { kind: "upcoming" }, now)).length,
    inbox: tasks.filter((t) => matchesView(t, { kind: "inbox" }, now)).length,
    all: tasks.filter((t) => matchesView(t, { kind: "all" }, now)).length,
    overdue: tasks.filter((t) => isOverdue(t, now)).length,
  };
}

/** Every tag in use, sorted, for the sidebar. */
export function allTags(tasks: Task[]): string[] {
  const set = new Set<string>();
  for (const t of tasks) if (!t.completed) t.tags.forEach((x) => set.add(x));
  return [...set].sort((a, b) => a.localeCompare(b, "sv"));
}

export interface DayProgress {
  done: number;
  total: number;
  ratio: number;
}

/** Today's completion: tasks completed today vs. (those + still-open-for-today). */
export function todayProgress(tasks: Task[], now: Date): DayProgress {
  const today = todayISO(now);
  const open = tasks.filter((t) => matchesView(t, { kind: "today" }, now)).length;
  const doneToday = tasks.filter(
    (t) => t.completed && t.completedAt !== null &&
      toISO(new Date(t.completedAt)) === today
  ).length;
  const total = open + doneToday;
  return { done: doneToday, total, ratio: total === 0 ? 0 : doneToday / total };
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
