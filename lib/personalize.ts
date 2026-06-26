// The "personal" in Pathly. A greeting that follows the clock and uses your
// name, a palette of accent themes you pick from, and a gentle daily line. All
// deterministic and pure so they're testable and never surprise you on reload.

import type { Habit } from "./types";
import { todayISO, addDays } from "./date";

export interface Theme {
  id: string;
  name: string;
  accent: string;
  soft: string;
}

// A small, considered palette — each one recolours the whole app.
export const THEMES: Theme[] = [
  { id: "emerald", name: "Smaragd", accent: "#0f766e", soft: "rgba(15,118,110,0.12)" },
  { id: "ocean", name: "Hav", accent: "#2563eb", soft: "rgba(37,99,235,0.12)" },
  { id: "violet", name: "Lavendel", accent: "#7c3aed", soft: "rgba(124,58,237,0.12)" },
  { id: "rose", name: "Ros", accent: "#e11d48", soft: "rgba(225,29,72,0.12)" },
  { id: "amber", name: "Bärnsten", accent: "#d97706", soft: "rgba(217,119,6,0.13)" },
  { id: "forest", name: "Skog", accent: "#16a34a", soft: "rgba(22,163,74,0.12)" },
  { id: "coral", name: "Korall", accent: "#ea580c", soft: "rgba(234,88,12,0.12)" },
  { id: "slate", name: "Grafit", accent: "#475569", soft: "rgba(71,85,105,0.14)" },
];

export function themeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** Time-aware Swedish greeting, optionally personalised with a name. */
export function greeting(name: string, now: Date): string {
  const h = now.getHours();
  let hello: string;
  if (h < 5) hello = "God natt";
  else if (h < 10) hello = "God morgon";
  else if (h < 12) hello = "God förmiddag";
  else if (h < 17) hello = "God eftermiddag";
  else if (h < 22) hello = "God kväll";
  else hello = "God natt";
  const trimmed = name.trim();
  return trimmed ? `${hello}, ${trimmed}` : hello;
}

// A line of encouragement, picked deterministically by the day so it's stable
// for a whole day but feels fresh tomorrow.
const LINES = [
  "Små steg varje dag blir en lång väg.",
  "Det viktigaste är att börja — inte att göra allt.",
  "En sak i taget. Du klarar det här.",
  "Bocka av något litet och få fart.",
  "Det gjorda är bättre än det perfekta.",
  "Fokus slår fart. Välj en sak.",
  "Du behöver inte göra allt idag, bara nästa sak.",
  "Framsteg, inte perfektion.",
  "Dagens du tackar morgondagens du.",
  "Gör det enkelt. Gör det klart.",
];

export function dailyLine(now: Date): string {
  // Days since epoch — stable per calendar day, independent of timezone noise.
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  return LINES[dayOfYear % LINES.length];
}

/** Current consecutive-day streak for a habit, counting back from today. */
export function habitStreak(habit: Habit, now: Date): number {
  const done = new Set(habit.history);
  let streak = 0;
  let cursor = todayISO(now);
  // Today not yet done shouldn't break a streak that's alive through yesterday.
  if (!done.has(cursor)) cursor = addDays(cursor, -1);
  while (done.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function doneToday(habit: Habit, now: Date): boolean {
  return habit.history.includes(todayISO(now));
}
