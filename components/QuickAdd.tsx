"use client";

import { useMemo, useState, forwardRef } from "react";
import { parseQuickAdd } from "@/lib/nlp";
import { formatDueLabel } from "@/lib/date";
import { describeRecurrence } from "@/lib/recurrence";
import type { ParsedInput } from "@/lib/types";

const PRIORITY_LABEL: Record<number, string> = { 1: "P1", 2: "P2", 3: "P3", 4: "" };

// One box, anything you type. As you write, a row of chips shows exactly what
// Pathly understood — so the magic never feels like a black box.
const QuickAdd = forwardRef<HTMLInputElement, {
  now: Date;
  onAdd: (parsed: ParsedInput) => void;
}>(function QuickAdd({ now, onAdd }, ref) {
  const [text, setText] = useState("");
  const parsed = useMemo(() => (text.trim() ? parseQuickAdd(text, now) : null), [text, now]);

  const submit = () => {
    const p = parseQuickAdd(text, now);
    if (!p.title) return;
    onAdd(p);
    setText("");
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-2 shadow-card">
      <div className="flex items-center gap-2">
        <span className="pl-2 text-accent" aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </span>
        <input
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder='Lägg till uppgift…  t.ex. "Ring mamma imorgon kl 18 #Familj !1"'
          className="min-w-0 flex-1 bg-transparent px-1 py-2 outline-none placeholder:text-muted"
        />
        <button
          onClick={submit}
          disabled={!parsed?.title}
          className="shrink-0 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-40"
        >
          Lägg till
        </button>
      </div>

      {parsed && (parsed.dueDate || parsed.priority < 4 || parsed.projectName || parsed.tags.length || parsed.recurrence) && (
        <div className="animate-in flex flex-wrap gap-1.5 px-2 pb-1.5 pt-1">
          {parsed.dueDate && (
            <Chip>📅 {formatDueLabel(parsed.dueDate, parsed.dueTime, now)}</Chip>
          )}
          {parsed.recurrence && <Chip>🔁 {describeRecurrence(parsed.recurrence)}</Chip>}
          {parsed.priority < 4 && (
            <Chip className="text-accent">⚑ {PRIORITY_LABEL[parsed.priority]}</Chip>
          )}
          {parsed.projectName && <Chip># {parsed.projectName}</Chip>}
          {parsed.tags.map((t) => (
            <Chip key={t}>@ {t}</Chip>
          ))}
        </div>
      )}
    </div>
  );
});

function Chip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`rounded-lg bg-surface-2 px-2 py-1 text-xs font-medium text-muted ${className}`}>
      {children}
    </span>
  );
}

export default QuickAdd;
