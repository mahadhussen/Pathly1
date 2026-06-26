// Shared domain types for Pathly. Everything here is plain data that gets
// serialised straight to localStorage — no classes, no methods — so the whole
// app state is trivially saveable, exportable and diffable.

/** 1 = highest (red), 2, 3, 4 = none. Mirrors Todoist's P1–P4 mental model. */
export type Priority = 1 | 2 | 3 | 4;

export type RecurrenceType = "daily" | "weekdays" | "weekly" | "monthly";

export interface Recurrence {
  type: RecurrenceType;
  /** For "weekly", the day to repeat on (0 = Sunday … 6 = Saturday). */
  weekday?: number;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  notes: string;
  priority: Priority;
  /** Local calendar day as "YYYY-MM-DD", or null for no date (Inbox). */
  dueDate: string | null;
  /** "HH:MM" 24h, or null. Only meaningful alongside dueDate. */
  dueTime: string | null;
  projectId: string | null;
  tags: string[];
  subtasks: Subtask[];
  recurrence: Recurrence | null;
  completed: boolean;
  completedAt: number | null;
  createdAt: number;
  /** Manual sort order within a list (lower = higher up). */
  order: number;
}

export interface Project {
  id: string;
  name: string;
  color: string;
}

export interface Habit {
  id: string;
  name: string;
  color: string;
  /** ISO days the habit was completed, e.g. ["2026-06-26"]. */
  history: string[];
  createdAt: number;
}

export interface Settings {
  name: string;
  /** id of the chosen accent theme (see lib/personalize.ts). */
  theme: string;
  mode: "light" | "dark";
  onboarded: boolean;
}

export interface AppState {
  settings: Settings;
  tasks: Task[];
  projects: Project[];
  habits: Habit[];
}

/** A parsed quick-add line, before it becomes a real Task. */
export interface ParsedInput {
  title: string;
  dueDate: string | null;
  dueTime: string | null;
  priority: Priority;
  projectName: string | null;
  tags: string[];
  recurrence: Recurrence | null;
}
