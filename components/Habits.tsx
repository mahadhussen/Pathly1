"use client";

import { useState } from "react";
import type { Habit } from "@/lib/types";
import { todayISO, addDays, fromISODate, WEEKDAYS_SV } from "@/lib/date";
import { habitStreak, doneToday } from "@/lib/personalize";

// Habits & streaks — the gentle gamification that keeps daily things alive
// (the good part of TickTick / Habitica, without the guilt trip).
export default function Habits({
  now,
  habits,
  onAdd,
  onToggleToday,
  onDelete,
}: {
  now: Date;
  habits: Habit[];
  onAdd: (name: string) => void;
  onToggleToday: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const days = Array.from({ length: 7 }, (_, i) => addDays(todayISO(now), i - 6));

  const add = () => {
    const n = name.trim();
    if (n) onAdd(n);
    setName("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-2 shadow-card">
        <span className="pl-2 text-accent">🔥</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Ny vana… t.ex. Läsa 10 min, Träna, Dricka vatten"
          className="min-w-0 flex-1 bg-transparent px-1 py-2 outline-none placeholder:text-muted"
        />
        <button onClick={add} className="shrink-0 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">
          Lägg till
        </button>
      </div>

      {habits.length === 0 ? (
        <Empty />
      ) : (
        <div className="space-y-2.5">
          {habits.map((h) => {
            const streak = habitStreak(h, now);
            const today = doneToday(h, now);
            return (
              <div key={h.id} className="animate-in rounded-xl border border-line bg-surface p-3 shadow-card">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onToggleToday(h.id)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-lg transition"
                    style={{ borderColor: h.color, background: today ? h.color : "transparent" }}
                    title={today ? "Ångra idag" : "Klart idag"}
                  >
                    {today ? "✓" : ""}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{h.name}</p>
                    <p className="text-xs text-muted">
                      {streak > 0 ? `🔥 ${streak} dagar i rad` : "Börja din streak idag"}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-end gap-1.5">
                    {days.map((d) => {
                      const done = h.history.includes(d);
                      const isToday = d === todayISO(now);
                      return (
                        <div key={d} className="flex flex-col items-center gap-1">
                          <span
                            className="h-6 w-6 rounded-md transition"
                            style={{
                              background: done ? h.color : "var(--surface-2)",
                              outline: isToday ? `2px solid ${h.color}` : "none",
                            }}
                            title={d}
                          />
                          <span className="text-[10px] text-muted">{WEEKDAYS_SV[fromISODate(d).getDay()]}</span>
                        </div>
                      );
                    })}
                  </div>

                  <button onClick={() => onDelete(h.id)} className="shrink-0 pl-1 text-muted hover:text-[#e11d48]" title="Ta bort vana">✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
      <p className="text-3xl">🔥</p>
      <p className="mt-2 font-medium">Bygg dagliga vanor</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
        Lägg till något du vill göra varje dag och håll din streak vid liv.
      </p>
    </div>
  );
}
