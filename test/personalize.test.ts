import { test } from "node:test";
import assert from "node:assert/strict";
import {
  greeting,
  dailyLine,
  themeById,
  habitStreak,
  doneToday,
  THEMES,
} from "../lib/personalize";
import type { Habit } from "../lib/types";

test("greeting follows the clock and uses the name", () => {
  assert.equal(greeting("Mahad", new Date(2026, 5, 26, 8)), "God morgon, Mahad");
  assert.equal(greeting("Mahad", new Date(2026, 5, 26, 14)), "God eftermiddag, Mahad");
  assert.equal(greeting("Mahad", new Date(2026, 5, 26, 20)), "God kväll, Mahad");
  assert.equal(greeting("Mahad", new Date(2026, 5, 26, 2)), "God natt, Mahad");
});

test("greeting without a name omits the comma", () => {
  assert.equal(greeting("", new Date(2026, 5, 26, 8)), "God morgon");
  assert.equal(greeting("   ", new Date(2026, 5, 26, 8)), "God morgon");
});

test("themeById falls back to the first theme", () => {
  assert.equal(themeById("nope").id, THEMES[0].id);
  assert.equal(themeById("ocean").name, "Hav");
});

test("dailyLine is stable within a day and always valid", () => {
  const a = dailyLine(new Date(2026, 5, 26, 8));
  const b = dailyLine(new Date(2026, 5, 26, 22));
  assert.equal(a, b);
  assert.ok(typeof a === "string" && a.length > 0);
});

const habit = (history: string[]): Habit => ({
  id: "h", name: "Läsa", color: "#0f766e", history, createdAt: 0,
});

test("habitStreak counts consecutive days back from today", () => {
  const now = new Date(2026, 5, 26, 10);
  assert.equal(habitStreak(habit(["2026-06-26", "2026-06-25", "2026-06-24"]), now), 3);
  // Today not done yet, but alive through yesterday — streak survives.
  assert.equal(habitStreak(habit(["2026-06-25", "2026-06-24"]), now), 2);
  // A gap breaks it.
  assert.equal(habitStreak(habit(["2026-06-26", "2026-06-24"]), now), 1);
  assert.equal(habitStreak(habit([]), now), 0);
});

test("doneToday checks today's ISO day", () => {
  const now = new Date(2026, 5, 26, 10);
  assert.equal(doneToday(habit(["2026-06-26"]), now), true);
  assert.equal(doneToday(habit(["2026-06-25"]), now), false);
});
