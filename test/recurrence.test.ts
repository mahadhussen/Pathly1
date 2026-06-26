import { test } from "node:test";
import assert from "node:assert/strict";
import { nextOccurrence, describeRecurrence } from "../lib/recurrence";

test("daily advances one day", () => {
  assert.equal(nextOccurrence({ type: "daily" }, "2026-06-26"), "2026-06-27");
});

test("weekdays skips the weekend", () => {
  // Fri -> Mon
  assert.equal(nextOccurrence({ type: "weekdays" }, "2026-06-26"), "2026-06-29");
  // Mon -> Tue
  assert.equal(nextOccurrence({ type: "weekdays" }, "2026-06-29"), "2026-06-30");
});

test("weekly without a weekday adds seven days", () => {
  assert.equal(nextOccurrence({ type: "weekly" }, "2026-06-26"), "2026-07-03");
});

test("weekly with a weekday lands on the next such day (strictly after)", () => {
  // From Fri to next Monday
  assert.equal(nextOccurrence({ type: "weekly", weekday: 1 }, "2026-06-26"), "2026-06-29");
  // From Fri to the *next* Friday, not the same day
  assert.equal(nextOccurrence({ type: "weekly", weekday: 5 }, "2026-06-26"), "2026-07-03");
});

test("monthly keeps the day and clamps short months", () => {
  assert.equal(nextOccurrence({ type: "monthly" }, "2026-06-26"), "2026-07-26");
  assert.equal(nextOccurrence({ type: "monthly" }, "2026-01-31"), "2026-02-28");
});

test("describeRecurrence is human and Swedish", () => {
  assert.equal(describeRecurrence({ type: "daily" }), "Varje dag");
  assert.equal(describeRecurrence({ type: "weekdays" }), "Vardagar");
  assert.equal(describeRecurrence({ type: "weekly", weekday: 1 }), "Varje måndag");
  assert.equal(describeRecurrence({ type: "monthly" }), "Varje månad");
});
