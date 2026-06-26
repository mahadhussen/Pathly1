import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // The accent is chosen by each person during onboarding and injected as a
      // CSS variable, so the whole UI quietly recolours to feel like *theirs*.
      colors: {
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        line: "var(--line)",
        ink: "var(--ink)",
        muted: "var(--muted)",
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(15, 23, 42, 0.25)",
        card: "0 1px 2px rgba(15, 23, 42, 0.06), 0 8px 24px -16px rgba(15, 23, 42, 0.25)",
      },
      keyframes: {
        floatin: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(0.8)", opacity: "0.4" },
          "60%": { transform: "scale(1.12)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        floatin: "floatin 0.35s ease-out both",
        pop: "pop 0.25s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
