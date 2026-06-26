"use client";

import { useState } from "react";
import { THEMES, greeting, themeById } from "@/lib/personalize";

// First run. We ask only what makes Habee feel like yours: a name, a colour,
// and light/dark. Everything previews live so the choice feels real.
export default function Onboarding({
  now,
  onComplete,
}: {
  now: Date;
  onComplete: (name: string, themeId: string, mode: "light" | "dark") => void;
}) {
  const [name, setName] = useState("");
  const [themeId, setThemeId] = useState("emerald");
  const [mode, setMode] = useState<"light" | "dark">("light");
  const theme = themeById(themeId);

  return (
    <div
      data-mode={mode}
      style={{ ["--accent" as string]: theme.accent, ["--accent-soft" as string]: theme.soft }}
      className="grid min-h-screen place-items-center bg-[var(--bg)] px-4 py-10 text-ink"
    >
      <div className="animate-in w-full max-w-lg rounded-3xl border border-line bg-surface p-7 shadow-soft sm:p-9">
        <div className="mb-6 flex items-center gap-3">
          <span
            className="grid h-11 w-11 place-items-center rounded-2xl text-white"
            style={{ background: theme.accent }}
          >
            <CheckMark />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Habee</h1>
            <p className="text-sm text-muted">Ordna din dag</p>
          </div>
        </div>

        <p className="mb-1 text-lg font-semibold">
          {greeting(name || "", now)} 👋
        </p>
        <p className="mb-6 text-sm text-muted">
          Låt oss göra den personlig. Allt sparas bara i din webbläsare — inget
          konto, ingen spårning.
        </p>

        <label className="mb-1.5 block text-sm font-medium">Vad heter du?</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onComplete(name, themeId, mode)}
          placeholder="Ditt namn"
          className="mb-6 w-full rounded-xl border border-line bg-surface-2 px-4 py-3 outline-none ring-accent/40 placeholder:text-muted focus:ring-2"
        />

        <label className="mb-2 block text-sm font-medium">Välj din färg</label>
        <div className="mb-6 grid grid-cols-4 gap-2.5 sm:grid-cols-8">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setThemeId(t.id)}
              title={t.name}
              aria-label={t.name}
              className={`aspect-square rounded-xl transition ${
                themeId === t.id ? "ring-2 ring-offset-2 ring-offset-surface" : "opacity-80 hover:opacity-100"
              }`}
              style={{ background: t.accent, boxShadow: themeId === t.id ? `0 0 0 2px ${t.accent}` : undefined }}
            />
          ))}
        </div>

        <label className="mb-2 block text-sm font-medium">Utseende</label>
        <div className="mb-8 grid grid-cols-2 gap-2.5">
          {(["light", "dark"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                mode === m
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line text-muted hover:border-accent/40"
              }`}
            >
              {m === "light" ? "☀️ Ljust" : "🌙 Mörkt"}
            </button>
          ))}
        </div>

        <button
          onClick={() => onComplete(name, themeId, mode)}
          className="w-full rounded-xl py-3 font-semibold text-white shadow-soft transition active:scale-[0.99]"
          style={{ background: theme.accent }}
        >
          Kom igång
        </button>
      </div>
    </div>
  );
}

function CheckMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
