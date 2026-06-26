import { test } from "node:test";
import assert from "node:assert/strict";
import { toMarkdown, fromMarkdown, recurrenceToText, textToRecurrence } from "../lib/obsidian";
import { toISODate } from "../lib/date";
import type { AppState, Task } from "../lib/types";

const now = new Date(2026, 5, 26, 10, 0, 0);

const make = (over: Partial<Task>): Task => ({
  id: Math.random().toString(36), title: "t", notes: "", priority: 4,
  dueDate: null, dueTime: null, projectId: null, tags: [], subtasks: [],
  recurrence: null, completed: false, completedAt: null, createdAt: 0,
  order: 0, ...over,
});

test("recurrence text maps both ways", () => {
  assert.equal(recurrenceToText({ type: "daily" }), "every day");
  assert.equal(recurrenceToText({ type: "weekdays" }), "every weekday");
  assert.equal(recurrenceToText({ type: "weekly" }), "every week");
  assert.equal(recurrenceToText({ type: "weekly", weekday: 1 }), "every week on Monday");
  assert.equal(recurrenceToText({ type: "monthly" }), "every month");

  assert.deepEqual(textToRecurrence("every day"), { type: "daily" });
  assert.deepEqual(textToRecurrence("every weekday"), { type: "weekdays" });
  assert.deepEqual(textToRecurrence("every week on Monday"), { type: "weekly", weekday: 1 });
  assert.deepEqual(textToRecurrence("every month"), { type: "monthly" });
  assert.equal(textToRecurrence("nonsense"), null);
});

test("a task line round-trips its inline metadata", () => {
  const state: AppState = {
    settings: { name: "Mahad", theme: "emerald", mode: "light", onboarded: true },
    projects: [],
    tasks: [make({
      title: "Ring tandläkaren", tags: ["viktigt"], dueDate: "2026-06-27",
      dueTime: "14:00", priority: 1, recurrence: { type: "weekly", weekday: 1 },
    })],
    habits: [],
  };
  const md = toMarkdown(state, now);
  const { tasks } = fromMarkdown(md);
  assert.equal(tasks.length, 1);
  const t = tasks[0];
  assert.equal(t.title, "Ring tandläkaren");
  assert.deepEqual(t.tags, ["viktigt"]);
  assert.equal(t.dueDate, "2026-06-27");
  assert.equal(t.dueTime, "14:00");
  assert.equal(t.priority, 1);
  assert.deepEqual(t.recurrence, { type: "weekly", weekday: 1 });
  assert.equal(t.projectName, null); // Inkorg
});

test("projects, notes and subtasks survive a round-trip", () => {
  const state: AppState = {
    settings: { name: "", theme: "emerald", mode: "light", onboarded: true },
    projects: [{ id: "p1", name: "Hälsa", color: "#0f766e" }],
    tasks: [
      make({ title: "Inboxgrej", notes: "rad ett\nrad två" }),
      make({
        title: "Gymmet", projectId: "p1", priority: 2,
        subtasks: [
          { id: "a", title: "Värm upp", done: true },
          { id: "b", title: "Stretcha", done: false },
        ],
      }),
    ],
    habits: [],
  };
  const md = toMarkdown(state, now);
  const { tasks } = fromMarkdown(md);

  const inbox = tasks.find((t) => t.title === "Inboxgrej")!;
  assert.equal(inbox.projectName, null);
  assert.equal(inbox.notes, "rad ett\nrad två");

  const gym = tasks.find((t) => t.title === "Gymmet")!;
  assert.equal(gym.projectName, "Hälsa");
  assert.equal(gym.priority, 2);
  assert.equal(gym.subtasks.length, 2);
  assert.equal(gym.subtasks[0].title, "Värm upp");
  assert.equal(gym.subtasks[0].done, true);
  assert.equal(gym.subtasks[1].done, false);
});

test("completed tasks keep their done state and date", () => {
  const completedAt = new Date(2026, 5, 25, 9).getTime();
  const state: AppState = {
    settings: { name: "", theme: "emerald", mode: "light", onboarded: true },
    projects: [],
    tasks: [make({ title: "Klart jobb", completed: true, completedAt })],
    habits: [],
  };
  const md = toMarkdown(state, now);
  assert.match(md, /- \[x\] Klart jobb/);
  const { tasks } = fromMarkdown(md);
  assert.equal(tasks[0].completed, true);
  assert.equal(toISODate(new Date(tasks[0].completedAt!)), "2026-06-25");
});
