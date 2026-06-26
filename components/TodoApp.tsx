"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AppState, ParsedInput, Settings, Task } from "@/lib/types";
import { load, save, defaultState, makeTask, newId, seedTasks } from "@/lib/store";
import { themeById, greeting, dailyLine } from "@/lib/personalize";
import { viewTasks, counts, allTags, todayProgress, type View } from "@/lib/filters";
import { nextOccurrence } from "@/lib/recurrence";
import { todayISO } from "@/lib/date";
import { fromMarkdown } from "@/lib/obsidian";

import Onboarding from "./Onboarding";
import Sidebar from "./Sidebar";
import QuickAdd from "./QuickAdd";
import TaskItem from "./TaskItem";
import Habits from "./Habits";
import Stats from "./Stats";
import FocusTimer from "./FocusTimer";
import SettingsPanel from "./SettingsPanel";

type Section = "list" | "habits" | "stats";

const PROJECT_COLORS = [
  "#0f766e", "#2563eb", "#7c3aed", "#e11d48", "#d97706",
  "#16a34a", "#ea580c", "#0891b2", "#db2777", "#475569",
];
const pickColor = (n: number) => PROJECT_COLORS[n % PROJECT_COLORS.length];

const VIEW_TITLE: Record<string, string> = {
  today: "Idag",
  upcoming: "Kommande",
  inbox: "Inkorg",
  all: "Alla uppgifter",
  completed: "Klart",
};

export default function TodoApp() {
  const [state, setState] = useState<AppState>(defaultState);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [section, setSection] = useState<Section>("list");
  const [view, setView] = useState<View>({ kind: "today" });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const quickRef = useRef<HTMLInputElement>(null);

  // Load saved data once, on the client.
  useEffect(() => {
    setState(load());
    setNow(new Date());
    setReady(true);
  }, []);

  // Persist on every change (after the first load).
  useEffect(() => {
    if (ready) save(state);
  }, [state, ready]);

  // Keep the clock fresh so greetings and "overdue" stay honest.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Drive the whole palette from the chosen theme + light/dark, at the root so
  // even the page background recolours.
  const theme = themeById(state.settings.theme);
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-mode", state.settings.mode);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-soft", theme.soft);
  }, [theme, state.settings.mode]);

  // ---- mutations -----------------------------------------------------------

  const completeOnboarding = (name: string, themeId: string, mode: "light" | "dark") => {
    setState((s) => ({
      ...s,
      settings: { name: name.trim(), theme: themeId, mode, onboarded: true },
      tasks: seedTasks(new Date()),
    }));
  };

  const addTask = (p: ParsedInput) => {
    setState((s) => {
      let projects = s.projects;
      let projectId: string | null = null;
      let tags = p.tags;
      let dueDate = p.dueDate;

      if (p.projectName) {
        const found = projects.find((pr) => pr.name.toLowerCase() === p.projectName!.toLowerCase());
        if (found) projectId = found.id;
        else {
          const np = { id: newId(), name: p.projectName, color: pickColor(projects.length) };
          projects = [...projects, np];
          projectId = np.id;
        }
      } else if (section === "list" && view.kind === "project") {
        projectId = view.id; // capture into the project you're looking at
      }

      // Contextual capture: typing in a view fills in the obvious blanks.
      if (section === "list" && view.kind === "today" && !dueDate) dueDate = todayISO(now);
      if (section === "list" && view.kind === "tag" && !tags.includes(view.name)) tags = [...tags, view.name];

      const task = makeTask({
        title: p.title, dueDate, dueTime: p.dueTime, priority: p.priority,
        projectId, tags, recurrence: p.recurrence,
      });
      return { ...s, projects, tasks: [task, ...s.tasks] };
    });
  };

  const toggleTask = (id: string) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => {
        if (t.id !== id) return t;
        // Completing a repeating task rolls it forward instead of closing it.
        if (!t.completed && t.recurrence && t.dueDate) {
          return {
            ...t,
            dueDate: nextOccurrence(t.recurrence, t.dueDate),
            subtasks: t.subtasks.map((x) => ({ ...x, done: false })),
          };
        }
        const completed = !t.completed;
        return { ...t, completed, completedAt: completed ? Date.now() : null };
      }),
    }));
  };

  const patchTask = (id: string, patch: Partial<Task>) =>
    setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));

  const deleteTask = (id: string) =>
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));

  const addProject = (name: string) =>
    setState((s) => ({
      ...s,
      projects: [...s.projects, { id: newId(), name, color: pickColor(s.projects.length) }],
    }));

  const addHabit = (name: string) =>
    setState((s) => ({
      ...s,
      habits: [...s.habits, { id: newId(), name, color: pickColor(s.habits.length + 3), history: [], createdAt: Date.now() }],
    }));

  const toggleHabitToday = (id: string) =>
    setState((s) => ({
      ...s,
      habits: s.habits.map((h) => {
        if (h.id !== id) return h;
        const t = todayISO(now);
        const has = h.history.includes(t);
        return { ...h, history: has ? h.history.filter((d) => d !== t) : [...h.history, t] };
      }),
    }));

  const deleteHabit = (id: string) =>
    setState((s) => ({ ...s, habits: s.habits.filter((h) => h.id !== id) }));

  const updateSettings = (patch: Partial<Settings>) =>
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));

  const importState = (ns: AppState) => {
    setState({ ...defaultState(), ...ns, settings: { ...defaultState().settings, ...ns.settings, onboarded: true } });
    setSettingsOpen(false);
  };

  // Import tasks from an Obsidian-style Markdown file, recreating projects by
  // name. Imported tasks are appended (no dedupe) so nothing existing is lost.
  const importMarkdown = (text: string) => {
    setState((s) => {
      const { tasks: imported } = fromMarkdown(text);
      let projects = s.projects;
      const resolved = imported.map(({ projectName, ...t }) => {
        let projectId: string | null = null;
        if (projectName) {
          const found = projects.find((pr) => pr.name.toLowerCase() === projectName.toLowerCase());
          if (found) projectId = found.id;
          else {
            const np = { id: newId(), name: projectName, color: pickColor(projects.length) };
            projects = [...projects, np];
            projectId = np.id;
          }
        }
        return { ...t, projectId };
      });
      return { ...s, projects, tasks: [...resolved, ...s.tasks] };
    });
    setSettingsOpen(false);
  };

  const resetAll = () => {
    setState(defaultState());
    setSettingsOpen(false);
    setSection("list");
    setView({ kind: "today" });
  };

  // ---- derived -------------------------------------------------------------

  const c = useMemo(() => counts(state.tasks, now), [state.tasks, now]);
  const tags = useMemo(() => allTags(state.tasks), [state.tasks]);
  const tasks = useMemo(() => viewTasks(state.tasks, view, now), [state.tasks, view, now]);
  const prog = useMemo(() => todayProgress(state.tasks, now), [state.tasks, now]);

  const pickView = (v: View) => { setView(v); setSection("list"); setSidebarOpen(false); };
  const pickSection = (sec: "habits" | "stats") => { setSection(sec); setSidebarOpen(false); };

  const title =
    section === "habits" ? "Vanor" :
    section === "stats" ? "Statistik" :
    view.kind === "project" ? state.projects.find((p) => p.id === view.id)?.name ?? "Projekt" :
    view.kind === "tag" ? `@${view.name}` :
    VIEW_TITLE[view.kind];

  if (!ready) {
    return <div className="grid min-h-screen place-items-center text-muted">Laddar Habee…</div>;
  }

  if (!state.settings.onboarded) {
    return <Onboarding now={now} onComplete={completeOnboarding} />;
  }

  const sidebar = (
    <Sidebar
      section={section}
      view={view}
      counts={c}
      projects={state.projects}
      tags={tags}
      onPickView={pickView}
      onPickSection={pickSection}
      onPickTag={(name) => pickView({ kind: "tag", name })}
      onAddProject={addProject}
      onOpenFocus={() => { setFocusOpen(true); setSidebarOpen(false); }}
      onOpenSettings={() => { setSettingsOpen(true); setSidebarOpen(false); }}
      onClose={() => setSidebarOpen(false)}
    />
  );

  return (
    <div className="min-h-screen text-ink">
      <div className="mx-auto flex max-w-6xl">
        {/* Static sidebar on large screens */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-line bg-surface lg:block">
          {sidebar}
        </aside>

        {/* Mobile drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72 border-r border-line bg-surface">{sidebar}</div>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
          {/* Header */}
          <header className="mb-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-line text-lg lg:hidden"
                aria-label="Öppna meny"
              >
                ☰
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-xl font-bold tracking-tight">{greeting(state.settings.name, now)}</h1>
                <p className="truncate text-sm text-muted">{dailyLine(now)}</p>
              </div>
              <button onClick={() => setFocusOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-line" title="Fokus">⏱️</button>
              <button onClick={() => setSettingsOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-line" title="Inställningar">⚙️</button>
            </div>

            {prog.total > 0 && (
              <div className="mt-4 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${prog.ratio * 100}%` }} />
                </div>
                <span className="shrink-0 text-xs font-medium text-muted">{prog.done} av {prog.total} klara idag</span>
              </div>
            )}
          </header>

          {/* Content */}
          {section === "list" && (
            <>
              {view.kind !== "completed" && (
                <div className="mb-4">
                  <QuickAdd ref={quickRef} now={now} onAdd={addTask} />
                </div>
              )}

              <div className="mb-2 flex items-baseline gap-2">
                <h2 className="text-lg font-bold">{title}</h2>
                <span className="text-sm text-muted">{tasks.length}</span>
              </div>

              {tasks.length === 0 ? (
                <EmptyState view={view} />
              ) : (
                <div className="space-y-2">
                  {tasks.map((t) => (
                    <TaskItem
                      key={t.id}
                      task={t}
                      projects={state.projects}
                      now={now}
                      onToggle={toggleTask}
                      onPatch={patchTask}
                      onDelete={deleteTask}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {section === "habits" && (
            <>
              <h2 className="mb-3 text-lg font-bold">Vanor</h2>
              <Habits now={now} habits={state.habits} onAdd={addHabit} onToggleToday={toggleHabitToday} onDelete={deleteHabit} />
            </>
          )}

          {section === "stats" && (
            <>
              <h2 className="mb-3 text-lg font-bold">Statistik</h2>
              <Stats now={now} tasks={state.tasks} projects={state.projects} habits={state.habits} />
            </>
          )}
        </main>
      </div>

      {focusOpen && <FocusTimer onClose={() => setFocusOpen(false)} />}
      {settingsOpen && (
        <SettingsPanel
          settings={state.settings}
          state={state}
          now={now}
          onUpdate={updateSettings}
          onImport={importState}
          onImportMarkdown={importMarkdown}
          onReset={resetAll}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

function EmptyState({ view }: { view: View }) {
  const msg: Record<string, { icon: string; text: string }> = {
    today: { icon: "🌿", text: "Inget kvar idag. Njut av stunden!" },
    upcoming: { icon: "🗓️", text: "Inget planerat framåt än." },
    inbox: { icon: "📥", text: "Inkorgen är tom. Fånga en tanke ovan." },
    all: { icon: "🎉", text: "Inga öppna uppgifter. Allt är gjort!" },
    completed: { icon: "✅", text: "Inget avklarat än — det kommer." },
    project: { icon: "📁", text: "Inga uppgifter i det här projektet än." },
    tag: { icon: "🏷️", text: "Inga uppgifter med den etiketten." },
  };
  const m = msg[view.kind] ?? msg.all;
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center">
      <p className="text-4xl">{m.icon}</p>
      <p className="mt-3 text-muted">{m.text}</p>
    </div>
  );
}
