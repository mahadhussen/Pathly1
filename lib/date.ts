// Date helpers. Habee stores due dates as plain "YYYY-MM-DD" strings in the
// user's local calendar, never as timestamps — so a task due "today" stays due
// today regardless of timezone or DST. All functions here are pure and take an
// explicit `now` where the current moment matters, which keeps them testable.

import type { Task } from "./types";

const WEEKDAYS_SV = ["sön", "mån", "tis", "ons", "tors", "fre", "lör"];
const MONTHS_SV = [
  "jan", "feb", "mar", "apr", "maj", "jun",
  "jul", "aug", "sep", "okt", "nov", "dec",
];

/** "YYYY-MM-DD" for a Date, in its local calendar fields. */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse "YYYY-MM-DD" to a local Date at noon (noon dodges DST edges). */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function todayISO(now: Date): string {
  return toISODate(now);
}

export function addDays(iso: string, n: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** Whole-day difference (b - a), positive when b is later. */
export function daysBetween(aISO: string, bISO: string): number {
  const a = fromISODate(aISO).getTime();
  const b = fromISODate(bISO).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function isToday(iso: string | null, now: Date): boolean {
  return iso !== null && iso === todayISO(now);
}

export function isOverdue(task: Task, now: Date): boolean {
  if (task.completed || !task.dueDate) return false;
  return daysBetween(task.dueDate, todayISO(now)) > 0;
}

/** A human, Swedish, relative label for a due date — "Idag", "Imorgon", … */
export function formatDueLabel(iso: string, time: string | null, now: Date): string {
  const diff = daysBetween(todayISO(now), iso);
  let label: string;
  if (diff === 0) label = "Idag";
  else if (diff === 1) label = "Imorgon";
  else if (diff === -1) label = "Igår";
  else {
    const d = fromISODate(iso);
    const wd = WEEKDAYS_SV[d.getDay()];
    const sameYear = d.getFullYear() === now.getFullYear();
    label = `${wd} ${d.getDate()} ${MONTHS_SV[d.getMonth()]}`;
    if (!sameYear) label += ` ${d.getFullYear()}`;
  }
  return time ? `${label} ${time}` : label;
}

export { WEEKDAYS_SV, MONTHS_SV };
