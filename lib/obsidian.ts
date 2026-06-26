// Obsidian bridge. Habee is local-first, and so is Obsidian — a folder of
// plain Markdown. This module turns your tasks (and their notes) into
// Markdown that Obsidian reads natively, and parses such Markdown back. It's
// the seam that lets Habee become a "second brain": capture in Habee, keep it
// forever in your vault.
//
// The format is compatible with the popular Obsidian **Tasks** plugin:
//   - [ ] Title #tag 📅 2026-06-27 ⏫ 🔁 every day
//   - [x] Done thing ✅ 2026-06-26
// Pure functions, fully round-trippable, covered by tests.

import type { AppState, Priority, Recurrence, Task } from "./types";
import { makeTask } from "./store";
import { toISODate } from "./date";

const EN_WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const PRIORITY_EMOJI: Record<Priority, string> = { 1: "🔺", 2: "⏫", 3: "🔼", 4: "" };
const EMOJI_PRIORITY: Record<string, Priority> = { "🔺": 1, "⏫": 2, "🔼": 3, "🔽": 4 };

/** A parsed-from-Markdown task that still needs its project resolved by id. */
export type ImportedTask = Task & { projectName: string | null };

export function recurrenceToText(rec: Recurrence): string {
  switch (rec.type) {
    case "daily": return "every day";
    case "weekdays": return "every weekday";
    case "weekly": return rec.weekday === undefined ? "every week" : `every week on ${EN_WEEKDAY[rec.weekday]}`;
    case "monthly": return "every month";
  }
}

export function textToRecurrence(raw: string): Recurrence | null {
  const s = raw.trim().toLowerCase();
  if (s === "every day" || s === "daily") return { type: "daily" };
  if (s === "every weekday" || s === "weekdays") return { type: "weekdays" };
  if (s === "every month" || s === "monthly") return { type: "monthly" };
  const m = s.match(/^every week(?: on (\w+))?$/);
  if (m) {
    if (!m[1]) return { type: "weekly" };
    const wd = EN_WEEKDAY.findIndex((d) => d.toLowerCase() === m[1]);
    return wd >= 0 ? { type: "weekly", weekday: wd } : { type: "weekly" };
  }
  return null;
}

function taskToLine(task: Task): string {
  const parts: string[] = [`- [${task.completed ? "x" : " "}] ${task.title}`];
  for (const tag of task.tags) parts.push(`#${tag}`);
  if (task.dueDate) parts.push(`📅 ${task.dueDate}`);
  if (task.dueTime) parts.push(`⏰ ${task.dueTime}`);
  if (PRIORITY_EMOJI[task.priority]) parts.push(PRIORITY_EMOJI[task.priority]);
  if (task.recurrence) parts.push(`🔁 ${recurrenceToText(task.recurrence)}`);
  if (task.completed && task.completedAt) parts.push(`✅ ${toISODate(new Date(task.completedAt))}`);
  return parts.join(" ");
}

/** Render the whole board as one Obsidian-friendly Markdown document. */
export function toMarkdown(state: AppState, now: Date): string {
  const lines: string[] = [];
  const who = state.settings.name ? `${state.settings.name}s ` : "";
  lines.push(`# Habee — ${who}uppgifter`);
  lines.push("");
  lines.push(`> Exporterad ${toISODate(now)} · ${state.tasks.length} uppgifter`);
  lines.push("");

  const groups: { name: string; id: string | null }[] = [
    { name: "Inkorg", id: null },
    ...state.projects.map((p) => ({ name: p.name, id: p.id })),
  ];

  for (const g of groups) {
    const inGroup = state.tasks.filter((t) => t.projectId === g.id);
    if (inGroup.length === 0) continue;
    lines.push(`## ${g.name}`);
    for (const task of inGroup) {
      lines.push(taskToLine(task));
      if (task.notes) {
        for (const noteLine of task.notes.split("\n")) lines.push(`  > ${noteLine}`);
      }
      for (const sub of task.subtasks) {
        lines.push(`\t- [${sub.done ? "x" : " "}] ${sub.title}`);
      }
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd() + "\n";
}

/** Pull the inline metadata out of a task line, returning the bare title. */
function parseTaskBody(body: string): {
  title: string; tags: string[]; dueDate: string | null; dueTime: string | null;
  priority: Priority; recurrence: Recurrence | null; completedAt: number | null;
} {
  let s = ` ${body} `;
  let completedAt: number | null = null;
  let dueDate: string | null = null;
  let dueTime: string | null = null;
  let priority: Priority = 4;
  let recurrence: Recurrence | null = null;
  const tags: string[] = [];

  const take = (re: RegExp, fn: (m: RegExpMatchArray) => void) => {
    const m = s.match(re);
    if (m) { fn(m); s = s.replace(m[0], " "); }
  };

  take(/\s✅\s*(\d{4}-\d{2}-\d{2})/, (m) => { completedAt = new Date(`${m[1]}T12:00:00`).getTime(); });
  take(/\s📅\s*(\d{4}-\d{2}-\d{2})/, (m) => { dueDate = m[1]; });
  take(/\s⏰\s*(\d{2}:\d{2})/, (m) => { dueTime = m[1]; });
  take(/\s(🔺|⏫|🔼|🔽)/, (m) => { priority = EMOJI_PRIORITY[m[1]]; });

  let tagM: RegExpMatchArray | null;
  const tagRe = /\s#([\p{L}\d_-]+)/gu;
  while ((tagM = tagRe.exec(s)) !== null) tags.push(tagM[1]);
  s = s.replace(/\s#[\p{L}\d_-]+/gu, " ");

  // Recurrence is last; its text may contain spaces, so grab to end of line.
  take(/\s🔁\s*([^\n]+?)\s*$/, (m) => { recurrence = textToRecurrence(m[1]); });

  return { title: s.replace(/\s+/g, " ").trim(), tags, dueDate, dueTime, priority, recurrence, completedAt };
}

const TASK_RE = /^(\s*)- \[([ xX])\]\s?(.*)$/;
const NOTE_RE = /^\s*> ?(.*)$/;
const HEADING_RE = /^##\s+(.*)$/;

/** Parse a Markdown document back into tasks (projects via ## headings). */
export function fromMarkdown(md: string): { tasks: ImportedTask[] } {
  const lines = md.split(/\r?\n/);
  const tasks: ImportedTask[] = [];
  let project: string | null = null;
  let current: ImportedTask | null = null;
  const noteBuf: string[] = [];

  const flushNotes = () => {
    if (current && noteBuf.length) {
      current.notes = noteBuf.join("\n");
      noteBuf.length = 0;
    }
  };

  for (const line of lines) {
    const heading = line.match(HEADING_RE);
    if (heading) {
      flushNotes();
      current = null;
      const name = heading[1].trim();
      project = name.toLowerCase() === "inkorg" ? null : name;
      continue;
    }

    const taskM = line.match(TASK_RE);
    if (taskM) {
      const indented = taskM[1].length > 0;
      const done = taskM[2].toLowerCase() === "x";
      // Indented checkbox under an open task → it's a subtask.
      if (indented && current) {
        flushNotes();
        current.subtasks.push({ id: makeTask({ title: "x" }).id, title: taskM[3].trim(), done });
        continue;
      }
      flushNotes();
      const p = parseTaskBody(taskM[3]);
      current = {
        ...makeTask({
          title: p.title, dueDate: p.dueDate, dueTime: p.dueTime, priority: p.priority,
          tags: p.tags, recurrence: p.recurrence, completed: done,
          completedAt: done ? p.completedAt ?? Date.now() : null,
        }),
        projectName: project,
      };
      tasks.push(current);
      continue;
    }

    const noteM = line.match(NOTE_RE);
    if (noteM && current) { noteBuf.push(noteM[1]); continue; }

    if (line.trim() === "") { flushNotes(); }
  }
  flushNotes();
  return { tasks };
}
