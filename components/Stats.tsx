"use client";

import type { Habit, Project, Task } from "@/lib/types";
import { counts, todayProgress } from "@/lib/filters";
import { habitStreak } from "@/lib/personalize";

// A small productivity dashboard — your karma at a glance (à la Todoist),
// computed live from local data.
export default function Stats({
  now,
  tasks,
  projects,
  habits,
}: {
  now: Date;
  tasks: Task[];
  projects: Project[];
  habits: Habit[];
}) {
  const c = counts(tasks, now);
  const prog = todayProgress(tasks, now);
  const completedAll = tasks.filter((t) => t.completed).length;
  const pct = Math.round(prog.ratio * 100);
  const bestStreak = habits.reduce((m, h) => Math.max(m, habitStreak(h, now)), 0);

  const byProject = projects
    .map((p) => ({ name: p.name, color: p.color, n: tasks.filter((t) => !t.completed && t.projectId === p.id).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);

  const byPriority = ([1, 2, 3, 4] as const).map((pri) => ({
    pri,
    n: tasks.filter((t) => !t.completed && t.priority === pri).length,
  }));
  const priColor: Record<number, string> = { 1: "#e11d48", 2: "#d97706", 3: "#2563eb", 4: "var(--muted)" };
  const maxPri = Math.max(1, ...byPriority.map((x) => x.n));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Klart idag" value={`${prog.done}/${prog.total}`} />
        <Stat label="Kvar idag" value={c.today} accent={c.today > 0} />
        <Stat label="Försenat" value={c.overdue} danger={c.overdue > 0} />
        <Stat label="Avklarat totalt" value={completedAll} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Today ring */}
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <p className="mb-3 text-sm font-semibold">Dagens framsteg</p>
          <div className="flex items-center gap-5">
            <Ring pct={pct} />
            <div className="text-sm text-muted">
              {prog.total === 0
                ? "Inget planerat för idag — lägg till något eller vila 🌿"
                : pct === 100
                ? "Allt avklarat. Snyggt jobbat! 🎉"
                : `Du är ${pct}% i mål idag.`}
              <p className="mt-1">🔥 Bästa vane-streak: <b>{bestStreak}</b> dagar</p>
            </div>
          </div>
        </div>

        {/* Priority breakdown */}
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <p className="mb-3 text-sm font-semibold">Öppna per prioritet</p>
          <div className="space-y-2">
            {byPriority.map(({ pri, n }) => (
              <div key={pri} className="flex items-center gap-3 text-sm">
                <span className="w-7 shrink-0 text-muted">P{pri}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(n / maxPri) * 100}%`, background: priColor[pri] }} />
                </div>
                <span className="w-6 shrink-0 text-right text-muted">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {byProject.length > 0 && (
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <p className="mb-3 text-sm font-semibold">Öppna per projekt</p>
          <div className="space-y-2">
            {byProject.map((p) => (
              <div key={p.name} className="flex items-center gap-3 text-sm">
                <span className="inline-flex w-28 shrink-0 items-center gap-2 truncate">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                  {p.name}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full" style={{ width: `${(p.n / byProject[0].n) * 100}%`, background: p.color }} />
                </div>
                <span className="w-6 shrink-0 text-right text-muted">{p.n}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent, danger }: { label: string; value: string | number; accent?: boolean; danger?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <p className="text-2xl font-bold" style={{ color: danger ? "#e11d48" : accent ? "var(--accent)" : undefined }}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}

function Ring({ pct }: { pct: number }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const off = circ - (pct / 100) * circ;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="9" />
        <circle
          cx="48" cy="48" r={r} fill="none" stroke="var(--accent)" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off} className="transition-all duration-500"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-lg font-bold">{pct}%</span>
    </div>
  );
}
