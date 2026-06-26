"use client";

import { useEffect, useRef, useState } from "react";

const WORK_MIN = 25;
const BREAK_MIN = 5;

// A Pomodoro focus timer (TickTick's best idea). Lives in a small floating
// panel so you can run a session next to your list. Ephemeral by design —
// it's a nudge, not another thing to track.
export default function FocusTimer({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"work" | "break">("work");
  const [secs, setSecs] = useState(WORK_MIN * 60);
  const [running, setRunning] = useState(false);
  const [rounds, setRounds] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [running]);

  // Roll over when the clock hits zero.
  useEffect(() => {
    if (secs !== 0) return;
    setRunning(false);
    if (mode === "work") {
      setRounds((r) => r + 1);
      setMode("break");
      setSecs(BREAK_MIN * 60);
    } else {
      setMode("work");
      setSecs(WORK_MIN * 60);
    }
  }, [secs, mode]);

  const reset = () => {
    setRunning(false);
    setSecs((mode === "work" ? WORK_MIN : BREAK_MIN) * 60);
  };
  const switchMode = (m: "work" | "break") => {
    setRunning(false);
    setMode(m);
    setSecs((m === "work" ? WORK_MIN : BREAK_MIN) * 60);
  };

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  return (
    <div className="fixed bottom-4 right-4 z-40 w-72 animate-in rounded-2xl border border-line bg-surface p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold">⏱️ Fokus</p>
        <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Stäng">✕</button>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-1.5">
        {(["work", "break"] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`rounded-lg py-1.5 text-sm font-medium transition ${
              mode === m ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2"
            }`}
          >
            {m === "work" ? "Arbeta" : "Paus"}
          </button>
        ))}
      </div>

      <p className="text-center text-5xl font-bold tabular-nums tracking-tight">{mm}:{ss}</p>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition active:scale-[0.99]"
        >
          {running ? "Pausa" : "Starta"}
        </button>
        <button onClick={reset} className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface-2">
          Nollställ
        </button>
      </div>

      <p className="mt-3 text-center text-xs text-muted">Avklarade pass idag: <b>{rounds}</b></p>
    </div>
  );
}
