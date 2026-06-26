"use client";

import { useState } from "react";
import type { Project, Task, Priority, RecurrenceType } from "@/lib/types";
import { formatDueLabel, isOverdue } from "@/lib/date";
import { describeRecurrence } from "@/lib/recurrence";
import { newId } from "@/lib/store";

const PRIORITY_COLOR: Record<Priority, string> = {
  1: "#e11d48",
  2: "#d97706",
  3: "#2563eb",
  4: "var(--muted)",
};

export default function TaskItem({
  task,
  projects,
  now,
  onToggle,
  onPatch,
  onDelete,
}: {
  task: Task;
  projects: Project[];
  now: Date;
  onToggle: (id: string) => void;
  onPatch: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [newSub, setNewSub] = useState("");
  const project = projects.find((p) => p.id === task.projectId) ?? null;
  const overdue = isOverdue(task, now);
  const subDone = task.subtasks.filter((s) => s.done).length;

  const cyclePriority = () =>
    onPatch(task.id, { priority: (((task.priority % 4) + 1) as Priority) });

  const addSub = () => {
    const t = newSub.trim();
    if (!t) return;
    onPatch(task.id, { subtasks: [...task.subtasks, { id: newId(), title: t, done: false }] });
    setNewSub("");
  };
  const toggleSub = (id: string) =>
    onPatch(task.id, {
      subtasks: task.subtasks.map((s) => (s.id === id ? { ...s, done: !s.done } : s)),
    });
  const removeSub = (id: string) =>
    onPatch(task.id, { subtasks: task.subtasks.filter((s) => s.id !== id) });

  return (
    <div className="animate-in rounded-xl border border-line bg-surface px-3 py-2.5 shadow-card transition">
      <div className="flex items-start gap-3">
        {/* Checkbox, tinted by priority */}
        <button
          onClick={() => onToggle(task.id)}
          aria-label={task.completed ? "Markera ej klar" : "Markera klar"}
          className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition"
          style={{
            borderColor: PRIORITY_COLOR[task.priority],
            background: task.completed ? PRIORITY_COLOR[task.priority] : "transparent",
          }}
        >
          {task.completed && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="animate-pop">
              <path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <button onClick={() => setOpen((v) => !v)} className="block w-full text-left">
            <span className={`text-[15px] ${task.completed ? "done-line text-muted" : ""}`}>
              {task.title}
            </span>
          </button>

          {/* Meta chips */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {task.dueDate && (
              <span className={overdue ? "font-medium text-[#e11d48]" : ""}>
                📅 {formatDueLabel(task.dueDate, task.dueTime, now)}
              </span>
            )}
            {task.recurrence && <span>🔁 {describeRecurrence(task.recurrence)}</span>}
            {task.subtasks.length > 0 && (
              <span>☑ {subDone}/{task.subtasks.length}</span>
            )}
            {project && (
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ background: project.color }} />
                {project.name}
              </span>
            )}
            {task.tags.map((t) => (
              <span key={t} className="text-accent">@{t}</span>
            ))}
            {task.notes && !open && <span title={task.notes}>📝</span>}
          </div>
        </div>

        {/* Priority flag */}
        <button
          onClick={cyclePriority}
          title="Ändra prioritet"
          className="mt-0.5 shrink-0 text-base leading-none transition hover:scale-110"
          style={{ color: PRIORITY_COLOR[task.priority] }}
        >
          ⚑
        </button>
      </div>

      {open && (
        <div className="animate-in mt-3 space-y-3 border-t border-line pt-3">
          <textarea
            defaultValue={task.notes}
            onBlur={(e) => onPatch(task.id, { notes: e.target.value })}
            placeholder="Anteckningar…"
            rows={2}
            className="w-full resize-y rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
          />

          {/* Subtasks */}
          <div className="space-y-1.5">
            {task.subtasks.map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={s.done} onChange={() => toggleSub(s.id)} className="accent-[var(--accent)]" />
                <span className={`flex-1 ${s.done ? "text-muted line-through" : ""}`}>{s.title}</span>
                <button onClick={() => removeSub(s.id)} className="text-muted hover:text-[#e11d48]">✕</button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span className="text-muted">＋</span>
              <input
                value={newSub}
                onChange={(e) => setNewSub(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSub()}
                placeholder="Lägg till deluppgift"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
              />
            </div>
          </div>

          {/* Editors */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Field label="Datum">
              <input
                type="date"
                value={task.dueDate ?? ""}
                onChange={(e) => onPatch(task.id, { dueDate: e.target.value || null })}
                className="w-full rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-sm outline-none"
              />
            </Field>
            <Field label="Tid">
              <input
                type="time"
                value={task.dueTime ?? ""}
                onChange={(e) => onPatch(task.id, { dueTime: e.target.value || null })}
                className="w-full rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-sm outline-none"
              />
            </Field>
            <Field label="Projekt">
              <select
                value={task.projectId ?? ""}
                onChange={(e) => onPatch(task.id, { projectId: e.target.value || null })}
                className="w-full rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-sm outline-none"
              >
                <option value="">Inkorg</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Upprepa">
              <select
                value={task.recurrence?.type ?? ""}
                onChange={(e) => {
                  const v = e.target.value as RecurrenceType | "";
                  onPatch(task.id, { recurrence: v ? { type: v } : null });
                }}
                className="w-full rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-sm outline-none"
              >
                <option value="">Aldrig</option>
                <option value="daily">Varje dag</option>
                <option value="weekdays">Vardagar</option>
                <option value="weekly">Varje vecka</option>
                <option value="monthly">Varje månad</option>
              </select>
            </Field>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => onDelete(task.id)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#e11d48] transition hover:bg-[#e11d48]/10"
            >
              Ta bort
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}
