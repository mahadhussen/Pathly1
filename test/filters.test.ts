import { test } from "node:test";
import assert from "node:assert/strict";
import { viewTasks, counts, sortTasks, allTags, todayProgress } from "../lib/filters";
import type { Task } from "../lib/types";

const now = new Date(2026, 5, 26, 10, 0, 0);

const make = (over: Partial<Task>): Task => ({
  id: Math.random().toString(36), title: "t", notes: "", priority: 4,
  dueDate: null, dueTime: null, projectId: null, tags: [], subtasks: [],
  recurrence: null, completed: false, completedAt: null, createdAt: 0,
  order: 0, ...over,
});

const todayTask = make({ id: "today", dueDate: "2026-06-26" });
const overdueTask = make({ id: "over", dueDate: "2026-06-24" });
const futureTask = make({ id: "future", dueDate: "2026-06-28" });
const inboxTask = make({ id: "inbox" });
const doneTask = make({
  id: "done", completed: true, completedAt: new Date(2026, 5, 26, 9).getTime(),
  dueDate: "2026-06-26",
});
const projTask = make({ id: "p", projectId: "proj1", dueDate: "2026-06-30" });

const all = [todayTask, overdueTask, futureTask, inboxTask, doneTask, projTask];

test("Today view includes due-today and overdue, not future or done", () => {
  const ids = viewTasks(all, { kind: "today" }, now).map((t) => t.id);
  assert.deepEqual(new Set(ids), new Set(["today", "over"]));
});

test("Upcoming view is strictly future and open", () => {
  const ids = viewTasks(all, { kind: "upcoming" }, now).map((t) => t.id);
  assert.deepEqual(new Set(ids), new Set(["future", "p"]));
});

test("Inbox is every open task with no project (dates allowed)", () => {
  const ids = viewTasks(all, { kind: "inbox" }, now).map((t) => t.id);
  assert.deepEqual(new Set(ids), new Set(["today", "over", "future", "inbox"]));
});

test("Completed view only shows done tasks", () => {
  const ids = viewTasks(all, { kind: "completed" }, now).map((t) => t.id);
  assert.deepEqual(ids, ["done"]);
});

test("project and tag views filter accordingly", () => {
  assert.deepEqual(
    viewTasks(all, { kind: "project", id: "proj1" }, now).map((t) => t.id),
    ["p"],
  );
  const tagged = make({ id: "tg", tags: ["hem"] });
  assert.deepEqual(
    viewTasks([tagged, inboxTask], { kind: "tag", name: "hem" }, now).map((t) => t.id),
    ["tg"],
  );
});

test("sortTasks orders by priority then due date", () => {
  const a = make({ id: "a", priority: 4, dueDate: "2026-06-26" });
  const b = make({ id: "b", priority: 1, dueDate: "2026-07-01" });
  const c = make({ id: "c", priority: 1, dueDate: "2026-06-27" });
  assert.deepEqual(sortTasks([a, b, c]).map((t) => t.id), ["c", "b", "a"]);
});

test("counts summarise the sidebar badges", () => {
  const c = counts(all, now);
  assert.equal(c.today, 2);
  assert.equal(c.upcoming, 2);
  assert.equal(c.inbox, 4);
  assert.equal(c.overdue, 1);
});

test("allTags lists open tasks' tags sorted", () => {
  const tasks = [make({ tags: ["zeta", "alfa"] }), make({ tags: ["alfa"] })];
  assert.deepEqual(allTags(tasks), ["alfa", "zeta"]);
});

test("todayProgress reflects done vs. open for today", () => {
  const p = todayProgress(all, now);
  assert.equal(p.done, 1); // doneTask completed today
  assert.equal(p.total, 3); // today + overdue + done
  assert.ok(Math.abs(p.ratio - 1 / 3) < 1e-9);
});
