"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";
import type { View, Counts } from "@/lib/filters";

type Section = "list" | "habits" | "stats";

export default function Sidebar({
  section,
  view,
  counts,
  projects,
  tags,
  onPickView,
  onPickSection,
  onPickTag,
  onAddProject,
  onOpenFocus,
  onOpenSettings,
  onClose,
}: {
  section: Section;
  view: View;
  counts: Counts;
  projects: Project[];
  tags: string[];
  onPickView: (v: View) => void;
  onPickSection: (s: "habits" | "stats") => void;
  onPickTag: (name: string) => void;
  onAddProject: (name: string) => void;
  onOpenFocus: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [projName, setProjName] = useState("");

  const isView = (k: View["kind"]) => section === "list" && view.kind === k;

  const submitProject = () => {
    const n = projName.trim();
    if (n) onAddProject(n);
    setProjName("");
    setAdding(false);
  };

  return (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto p-3">
      <div className="space-y-0.5">
        <Item label="Idag" icon="📅" active={isView("today")} badge={counts.today} onClick={() => onPickView({ kind: "today" })} />
        <Item label="Kommande" icon="🗓️" active={isView("upcoming")} badge={counts.upcoming} onClick={() => onPickView({ kind: "upcoming" })} />
        <Item label="Inkorg" icon="📥" active={isView("inbox")} badge={counts.inbox} onClick={() => onPickView({ kind: "inbox" })} />
        <Item label="Alla uppgifter" icon="🗂️" active={isView("all")} badge={counts.all} onClick={() => onPickView({ kind: "all" })} />
        <Item label="Klart" icon="✅" active={isView("completed")} onClick={() => onPickView({ kind: "completed" })} />
      </div>

      <Divider />

      <div className="flex items-center justify-between px-2 pb-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Projekt</span>
        <button onClick={() => setAdding(true)} className="text-muted hover:text-accent" title="Nytt projekt">＋</button>
      </div>
      <div className="space-y-0.5">
        {projects.map((p) => (
          <Item
            key={p.id}
            label={p.name}
            dot={p.color}
            active={section === "list" && view.kind === "project" && view.id === p.id}
            onClick={() => onPickView({ kind: "project", id: p.id })}
          />
        ))}
        {adding && (
          <input
            autoFocus
            value={projName}
            onChange={(e) => setProjName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitProject();
              if (e.key === "Escape") { setAdding(false); setProjName(""); }
            }}
            onBlur={submitProject}
            placeholder="Projektnamn"
            className="w-full rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/40"
          />
        )}
        {projects.length === 0 && !adding && (
          <p className="px-2 py-1 text-xs text-muted">Inga projekt än.</p>
        )}
      </div>

      {tags.length > 0 && (
        <>
          <Divider />
          <span className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">Etiketter</span>
          <div className="flex flex-wrap gap-1.5 px-2">
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => onPickTag(t)}
                className={`rounded-lg px-2 py-1 text-xs font-medium transition ${
                  section === "list" && view.kind === "tag" && view.name === t
                    ? "bg-accent text-white"
                    : "bg-surface-2 text-muted hover:text-accent"
                }`}
              >
                @{t}
              </button>
            ))}
          </div>
        </>
      )}

      <Divider />

      <div className="space-y-0.5">
        <Item label="Vanor" icon="🔥" active={section === "habits"} onClick={() => onPickSection("habits")} />
        <Item label="Statistik" icon="📊" active={section === "stats"} onClick={() => onPickSection("stats")} />
        <Item label="Fokus (Pomodoro)" icon="⏱️" onClick={onOpenFocus} />
      </div>

      <div className="mt-auto pt-2">
        <Item label="Inställningar" icon="⚙️" onClick={onOpenSettings} />
        <button onClick={onClose} className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-muted lg:hidden">
          Stäng meny
        </button>
      </div>
    </nav>
  );
}

function Item({
  label, icon, dot, active, badge, onClick,
}: {
  label: string; icon?: string; dot?: string; active?: boolean; badge?: number; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
        active ? "bg-accent-soft font-semibold text-accent" : "text-ink hover:bg-surface-2"
      }`}
    >
      {icon && <span className="text-base">{icon}</span>}
      {dot && <span className="h-2.5 w-2.5 rounded-full" style={{ background: dot }} />}
      <span className="flex-1 truncate">{label}</span>
      {badge ? <span className="text-xs text-muted">{badge}</span> : null}
    </button>
  );
}

function Divider() {
  return <div className="my-2 h-px bg-line" />;
}
