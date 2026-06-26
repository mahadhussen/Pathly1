// Natural-language quick add — the feature that makes capture feel effortless,
// borrowed from Todoist. You type one line and Pathly pulls out the date, time,
// priority, project, tags and repeat rule, leaving a clean title behind.
//
//   "Ring tandläkaren imorgon kl 14 #Hälsa @viktigt !1"
//     → title "Ring tandläkaren", imorgon, 14:00, project Hälsa,
//       tag viktigt, priority 1
//
// Both Swedish and English keywords are understood, since "personal" should
// also mean "in your own words". parseQuickAdd is pure: pass `now` explicitly.

import type { ParsedInput, Priority, Recurrence } from "./types";
import { todayISO, addDays, fromISODate } from "./date";

const WEEKDAYS: Record<string, number> = {
  söndag: 0, sön: 0, sunday: 0, sun: 0,
  måndag: 1, mån: 1, monday: 1, mon: 1,
  tisdag: 2, tis: 2, tuesday: 2, tue: 2,
  onsdag: 3, ons: 3, wednesday: 3, wed: 3,
  torsdag: 4, tors: 4, tor: 4, thursday: 4, thu: 4,
  fredag: 5, fre: 5, friday: 5, fri: 5,
  lördag: 6, lör: 6, saturday: 6, sat: 6,
};

/** Next date (ISO) on or after today whose weekday matches. */
function nextWeekday(weekday: number, now: Date): string {
  let iso = todayISO(now);
  for (let i = 0; i < 7; i++) {
    if (fromISODate(iso).getDay() === weekday) return iso;
    iso = addDays(iso, 1);
  }
  return iso;
}

function clampTime(h: number, m: number): string | null {
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function parseQuickAdd(raw: string, now: Date): ParsedInput {
  let work = ` ${raw} `;
  const out: ParsedInput = {
    title: "",
    dueDate: null,
    dueTime: null,
    priority: 4,
    projectName: null,
    tags: [],
    recurrence: null,
  };

  // Replace the first match of `re` and capture it via `take`.
  const cut = (re: RegExp, take: (m: RegExpMatchArray) => void) => {
    const m = work.match(re);
    if (m) {
      take(m);
      work = work.replace(m[0], " ");
    }
  };

  // 1) Priority: !1–!4 or p1–p4 (1 = highest).
  cut(/\s(?:!|p)([1-4])\b/i, (m) => {
    out.priority = Number(m[1]) as Priority;
  });

  // 2) Tags (@tag) — collect every one.
  let tagMatch: RegExpMatchArray | null;
  const tagRe = /\s@([\p{L}\d_-]+)/gu;
  while ((tagMatch = tagRe.exec(work)) !== null) {
    out.tags.push(tagMatch[1]);
  }
  work = work.replace(/\s@[\p{L}\d_-]+/gu, " ");

  // 3) Project (#project) — first one wins.
  cut(/\s#([\p{L}\d_-]+)/u, (m) => {
    out.projectName = m[1];
  });

  // 4) Recurrence. "varje <veckodag>" before bare weekday dates below.
  cut(/\s(?:varje|every)\s+(söndag|sön|sunday|sun|måndag|mån|monday|mon|tisdag|tis|tuesday|tue|onsdag|ons|wednesday|wed|torsdag|tors|tor|thursday|thu|fredag|fre|friday|fri|lördag|lör|saturday|sat)\b/i,
    (m) => {
      const wd = WEEKDAYS[m[1].toLowerCase()];
      out.recurrence = { type: "weekly", weekday: wd };
      if (!out.dueDate) out.dueDate = nextWeekday(wd, now);
    });
  cut(/\s(?:varje dag|dagligen|every day|daily)\b/i, () => {
    out.recurrence = { type: "daily" };
  });
  cut(/\s(?:vardagar|weekdays)\b/i, () => {
    out.recurrence = { type: "weekdays" };
  });
  cut(/\s(?:varje vecka|veckovis|every week|weekly)\b/i, () => {
    out.recurrence = { type: "weekly" };
  });
  cut(/\s(?:varje månad|månadsvis|every month|monthly)\b/i, () => {
    out.recurrence = { type: "monthly" };
  });

  // 5) Time. "kl 14", "kl 9:30", or a bare "18:00" / "18.00".
  cut(/\s(?:kl\.?|klockan|at)\s*(\d{1,2})(?:[:.](\d{2}))?\b/i, (m) => {
    const t = clampTime(Number(m[1]), m[2] ? Number(m[2]) : 0);
    if (t) out.dueTime = t;
  });
  if (!out.dueTime) {
    cut(/\s(\d{1,2})[:.](\d{2})\b/, (m) => {
      const t = clampTime(Number(m[1]), Number(m[2]));
      if (t) out.dueTime = t;
    });
  }

  // 6) Dates (only if a recurring weekday didn't already set one).
  const setDate = (iso: string) => {
    if (!out.dueDate) out.dueDate = iso;
  };
  cut(/\s(idag|today)\b/i, () => setDate(todayISO(now)));
  cut(/\s(imorgon|imorrn|tomorrow)\b/i, () => setDate(addDays(todayISO(now), 1)));
  cut(/\s(övermorgon)\b/i, () => setDate(addDays(todayISO(now), 2)));
  cut(/\s(?:om|in)\s+(\d{1,3})\s+(?:dag|dagar|day|days)\b/i, (m) =>
    setDate(addDays(todayISO(now), Number(m[1]))));
  cut(/\s(?:nästa vecka|next week)\b/i, () => setDate(addDays(todayISO(now), 7)));
  // Bare weekday → next occurrence.
  cut(/\s(söndag|sön|sunday|sun|måndag|mån|monday|mon|tisdag|tis|tuesday|tue|onsdag|ons|wednesday|wed|torsdag|tors|tor|thursday|thu|fredag|fre|friday|fri|lördag|lör|saturday|sat)\b/i,
    (m) => setDate(nextWeekday(WEEKDAYS[m[1].toLowerCase()], now)));

  out.title = work.replace(/\s+/g, " ").trim();
  return out;
}
