// Persistence. Habee keeps everything in localStorage — no account, no server,
// nothing leaves the device. This module is the only place that touches storage,
// so the rest of the app stays pure and the data shape lives in one spot.

import type { AppState, Task, Priority } from "./types";
import { todayISO, addDays } from "./date";

const STORAGE_KEY = "habee.v1";

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export function defaultState(): AppState {
  return {
    settings: { name: "", theme: "emerald", mode: "light", onboarded: false },
    tasks: [],
    projects: [],
    habits: [],
  };
}

/** Build a base task with sensible defaults; callers override what they need. */
export function makeTask(partial: Partial<Task> & { title: string }): Task {
  const now = Date.now();
  return {
    id: newId(),
    title: partial.title,
    notes: partial.notes ?? "",
    priority: (partial.priority ?? 4) as Priority,
    dueDate: partial.dueDate ?? null,
    dueTime: partial.dueTime ?? null,
    projectId: partial.projectId ?? null,
    tags: partial.tags ?? [],
    subtasks: partial.subtasks ?? [],
    recurrence: partial.recurrence ?? null,
    completed: partial.completed ?? false,
    completedAt: partial.completedAt ?? null,
    createdAt: partial.createdAt ?? now,
    order: partial.order ?? now,
  };
}

export function load(): AppState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    // Merge over defaults so older saves missing newer fields still load.
    const base = defaultState();
    return {
      settings: { ...base.settings, ...parsed.settings },
      tasks: (parsed.tasks ?? []).map((t) => makeTask(t as Task)),
      projects: parsed.projects ?? [],
      habits: parsed.habits ?? [],
    };
  } catch {
    return defaultState();
  }
}

export function save(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked (private mode) — fail quietly, app still works
    // for the session.
  }
}

/** A small, friendly starter set so a brand-new board never looks empty. */
export function seedTasks(now: Date): Task[] {
  const today = todayISO(now);
  return [
    makeTask({
      title: "Välkommen till Habee 👋 — bocka av mig!",
      dueDate: today,
      priority: 2,
      order: 1,
    }),
    makeTask({
      title: "Prova snabbtillägg: skriv t.ex. \"Ring mamma imorgon kl 18 !1\"",
      dueDate: today,
      notes: "Habee läser datum, tid, #projekt, @etikett och prioritet (!1–!4) direkt ur texten.",
      order: 2,
    }),
    makeTask({
      title: "Planera veckan",
      dueDate: addDays(today, 1),
      priority: 3,
      order: 3,
    }),
  ];
}

export { STORAGE_KEY };
