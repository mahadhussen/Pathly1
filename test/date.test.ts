import { test } from "node:test";
import assert from "node:assert/strict";
import {
  toISODate,
  fromISODate,
  addDays,
  daysBetween,
  isToday,
  isOverdue,
  formatDueLabel,
} from "../lib/date";
import type { Task } from "../lib/types";

// 2026-06-26 is a Friday (getDay() === 5).
const now = new Date(2026, 5, 26, 9, 0, 0);

const task = (over: Partial<Task>): Task => ({
  id: "t", title: "t", notes: "", priority: 4, dueDate: null, dueTime: null,
  projectId: null, tags: [], subtasks: [], recurrence: null, completed: false,
  completedAt: null, createdAt: 0, order: 0, ...over,
});

test("toISODate / fromISODate round-trip in local calendar", () => {
  assert.equal(toISODate(new Date(2026, 5, 26)), "2026-06-26");
  assert.equal(fromISODate("2026-06-26").getDay(), 5);
});

test("addDays crosses month boundaries", () => {
  assert.equal(addDays("2026-06-26", 1), "2026-06-27");
  assert.equal(addDays("2026-06-30", 1), "2026-07-01");
  assert.equal(addDays("2026-06-26", -1), "2026-06-25");
});

test("daysBetween counts whole days, signed", () => {
  assert.equal(daysBetween("2026-06-26", "2026-06-29"), 3);
  assert.equal(daysBetween("2026-06-29", "2026-06-26"), -3);
});

test("isToday and isOverdue respect completion", () => {
  assert.equal(isToday("2026-06-26", now), true);
  assert.equal(isToday("2026-06-27", now), false);
  assert.equal(isOverdue(task({ dueDate: "2026-06-25" }), now), true);
  assert.equal(isOverdue(task({ dueDate: "2026-06-25", completed: true }), now), false);
  assert.equal(isOverdue(task({ dueDate: "2026-06-26" }), now), false);
});

test("formatDueLabel gives friendly Swedish labels", () => {
  assert.equal(formatDueLabel("2026-06-26", null, now), "Idag");
  assert.equal(formatDueLabel("2026-06-27", null, now), "Imorgon");
  assert.equal(formatDueLabel("2026-06-25", null, now), "Igår");
  assert.equal(formatDueLabel("2026-06-26", "14:00", now), "Idag 14:00");
  assert.equal(formatDueLabel("2026-07-06", null, now), "mån 6 jul");
});
