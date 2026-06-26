import { test } from "node:test";
import assert from "node:assert/strict";
import { parseQuickAdd } from "../lib/nlp";

// 2026-06-26 is a Friday.
const now = new Date(2026, 5, 26, 9, 0, 0);

test("parses a rich Swedish line into clean fields", () => {
  const p = parseQuickAdd("Ring tandläkaren imorgon kl 14 #Hälsa @viktigt !1", now);
  assert.equal(p.title, "Ring tandläkaren");
  assert.equal(p.dueDate, "2026-06-27");
  assert.equal(p.dueTime, "14:00");
  assert.equal(p.projectName, "Hälsa");
  assert.deepEqual(p.tags, ["viktigt"]);
  assert.equal(p.priority, 1);
  assert.equal(p.recurrence, null);
});

test("plain text with just 'idag'", () => {
  const p = parseQuickAdd("Handla mjölk idag", now);
  assert.equal(p.title, "Handla mjölk");
  assert.equal(p.dueDate, "2026-06-26");
  assert.equal(p.priority, 4);
});

test("recurring weekday also schedules the next occurrence", () => {
  const p = parseQuickAdd("Gymmet varje måndag 18:00 #Träning", now);
  assert.equal(p.title, "Gymmet");
  assert.deepEqual(p.recurrence, { type: "weekly", weekday: 1 });
  assert.equal(p.dueDate, "2026-06-29"); // next Monday on/after Fri 26th
  assert.equal(p.dueTime, "18:00");
  assert.equal(p.projectName, "Träning");
});

test("monthly recurrence with priority", () => {
  const p = parseQuickAdd("Betala hyran varje månad !2", now);
  assert.equal(p.title, "Betala hyran");
  assert.deepEqual(p.recurrence, { type: "monthly" });
  assert.equal(p.priority, 2);
});

test("weekdays recurrence", () => {
  const p = parseQuickAdd("Städa vardagar", now);
  assert.equal(p.title, "Städa");
  assert.deepEqual(p.recurrence, { type: "weekdays" });
});

test("relative and bare-weekday dates", () => {
  assert.equal(parseQuickAdd("Plugga om 3 dagar", now).dueDate, "2026-06-29");
  assert.equal(parseQuickAdd("Rapport nästa vecka", now).dueDate, "2026-07-03");
  // Today is Friday, so a bare 'fredag' resolves to today.
  assert.equal(parseQuickAdd("Möte fredag", now).dueDate, "2026-06-26");
});

test("collects multiple tags and keeps a clean title", () => {
  const p = parseQuickAdd("Fixa buggen @backend @brådskande", now);
  assert.equal(p.title, "Fixa buggen");
  assert.deepEqual(p.tags, ["backend", "brådskande"]);
});

test("understands English keywords too", () => {
  const p = parseQuickAdd("Call dad tomorrow at 9 #Family p1", now);
  assert.equal(p.title, "Call dad");
  assert.equal(p.dueDate, "2026-06-27");
  assert.equal(p.dueTime, "09:00");
  assert.equal(p.projectName, "Family");
  assert.equal(p.priority, 1);
});
