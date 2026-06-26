// Recurring tasks. When a repeating task is ticked off, it doesn't vanish — it
// rolls forward to its next occurrence. nextOccurrence is pure and always
// returns a date strictly after `fromISO`, so completing a task can never leave
// it stuck on a past day.

import type { Recurrence } from "./types";
import { fromISODate, toISODate, addDays } from "./date";

export function nextOccurrence(rec: Recurrence, fromISO: string): string {
  switch (rec.type) {
    case "daily":
      return addDays(fromISO, 1);

    case "weekdays": {
      // Skip forward to the next Mon–Fri.
      let iso = addDays(fromISO, 1);
      let dow = fromISODate(iso).getDay();
      while (dow === 0 || dow === 6) {
        iso = addDays(iso, 1);
        dow = fromISODate(iso).getDay();
      }
      return iso;
    }

    case "weekly": {
      if (rec.weekday === undefined) return addDays(fromISO, 7);
      // Advance day by day until we hit the target weekday (1–7 days out).
      let iso = addDays(fromISO, 1);
      while (fromISODate(iso).getDay() !== rec.weekday) {
        iso = addDays(iso, 1);
      }
      return iso;
    }

    case "monthly": {
      const d = fromISODate(fromISO);
      const targetDay = d.getDate();
      d.setDate(1); // park on the 1st so month maths never overflows
      d.setMonth(d.getMonth() + 1);
      // Clamp (e.g. Jan 31 → Feb 28) to the last valid day of the new month.
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(targetDay, lastDay));
      return toISODate(d);
    }
  }
}

/** Short Swedish description for chips/badges, e.g. "Varje dag". */
export function describeRecurrence(rec: Recurrence): string {
  const days = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];
  switch (rec.type) {
    case "daily":
      return "Varje dag";
    case "weekdays":
      return "Vardagar";
    case "weekly":
      return rec.weekday === undefined ? "Varje vecka" : `Varje ${days[rec.weekday]}`;
    case "monthly":
      return "Varje månad";
  }
}
