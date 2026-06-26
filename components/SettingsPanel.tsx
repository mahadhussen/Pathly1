"use client";

import { useRef } from "react";
import type { AppState, Settings } from "@/lib/types";
import { THEMES } from "@/lib/personalize";

// Settings live in a sheet you can reach anytime — change your name, recolour
// the whole app, flip dark mode, or take your data with you. Your data is
// yours: export to a file, import it back, or wipe it clean.
export default function SettingsPanel({
  settings,
  state,
  onUpdate,
  onImport,
  onReset,
  onClose,
}: {
  settings: Settings;
  state: AppState;
  onUpdate: (patch: Partial<Settings>) => void;
  onImport: (state: AppState) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "habee-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppState;
        if (parsed && Array.isArray(parsed.tasks)) onImport(parsed);
        else alert("Filen ser inte ut som en Habee-säkerhetskopia.");
      } catch {
        alert("Kunde inte läsa filen.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="animate-in h-full w-full max-w-md overflow-y-auto bg-surface p-6 shadow-soft"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "floatin 0.25s ease-out both" }}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold">Inställningar</h2>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Stäng">✕</button>
        </div>

        <Section title="Ditt namn">
          <input
            value={settings.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Ditt namn"
            className="w-full rounded-xl border border-line bg-surface-2 px-4 py-2.5 outline-none focus:ring-2 focus:ring-accent/40"
          />
        </Section>

        <Section title="Färgtema">
          <div className="grid grid-cols-8 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => onUpdate({ theme: t.id })}
                title={t.name}
                aria-label={t.name}
                className={`aspect-square rounded-lg transition ${settings.theme === t.id ? "ring-2 ring-offset-2 ring-offset-surface" : "opacity-80 hover:opacity-100"}`}
                style={{ background: t.accent }}
              />
            ))}
          </div>
        </Section>

        <Section title="Utseende">
          <div className="grid grid-cols-2 gap-2">
            {(["light", "dark"] as const).map((m) => (
              <button
                key={m}
                onClick={() => onUpdate({ mode: m })}
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  settings.mode === m ? "border-accent bg-accent-soft text-accent" : "border-line text-muted"
                }`}
              >
                {m === "light" ? "☀️ Ljust" : "🌙 Mörkt"}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Dina data">
          <p className="mb-3 text-sm text-muted">
            Allt sparas lokalt i den här webbläsaren. Ta en säkerhetskopia eller
            flytta den till en annan enhet.
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={exportData} className="rounded-xl border border-line px-4 py-2 text-sm font-medium hover:bg-surface-2">
              ⬇️ Exportera
            </button>
            <button onClick={() => fileRef.current?.click()} className="rounded-xl border border-line px-4 py-2 text-sm font-medium hover:bg-surface-2">
              ⬆️ Importera
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])}
            />
          </div>
        </Section>

        <Section title="Återställ">
          <button
            onClick={() => {
              if (confirm("Radera alla uppgifter, projekt och vanor? Detta går inte att ångra.")) onReset();
            }}
            className="rounded-xl border border-[#e11d48]/40 px-4 py-2 text-sm font-medium text-[#e11d48] hover:bg-[#e11d48]/10"
          >
            Rensa allt
          </button>
        </Section>

        <p className="mt-8 text-center text-xs text-muted">
          Habee · gratis & privat · byggd i din webbläsare
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}
