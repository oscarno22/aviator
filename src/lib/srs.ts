/**
 * SM-2-lite spaced repetition. Pure functions; dates are local "YYYY-MM-DD".
 */
export type Grade = "again" | "hard" | "good" | "easy";

export interface CardProgress {
  id: string;
  ease: number;          // 1.3 .. 2.5
  intervalDays: number;  // 0 = due again this session
  due: string;           // YYYY-MM-DD
  reps: number;          // successful reviews in a row
  lapses: number;
  last?: string;         // last review date
}

export const MIN_EASE = 1.3;
export const MAX_EASE = 2.5;
export const MAX_INTERVAL = 180;

export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return todayStr(dt);
}

export function newProgress(id: string, today = todayStr()): CardProgress {
  return { id, ease: 2.5, intervalDays: 0, due: today, reps: 0, lapses: 0 };
}

export function isDue(p: CardProgress, today = todayStr()): boolean {
  return p.due <= today;
}

export function grade(p: CardProgress, g: Grade, today = todayStr()): CardProgress {
  let { ease, intervalDays, reps, lapses } = p;
  switch (g) {
    case "again":
      lapses += 1;
      reps = 0;
      intervalDays = 0;
      ease = Math.max(MIN_EASE, ease - 0.2);
      break;
    case "hard":
      reps += 1;
      intervalDays = Math.max(1, Math.round(intervalDays * 1.2));
      ease = Math.max(MIN_EASE, ease - 0.15);
      break;
    case "good":
      if (reps === 0) intervalDays = 1;
      else if (reps === 1) intervalDays = 3;
      else intervalDays = Math.round(intervalDays * ease);
      reps += 1;
      break;
    case "easy":
      if (reps === 0) intervalDays = 3;
      else if (reps === 1) intervalDays = 6;
      else intervalDays = Math.round(intervalDays * ease * 1.3);
      reps += 1;
      ease = Math.min(MAX_EASE, ease + 0.15);
      break;
  }
  intervalDays = Math.min(MAX_INTERVAL, intervalDays);
  return { ...p, ease, intervalDays, reps, lapses, last: today, due: addDays(today, intervalDays) };
}

/** Cards with high lapses or low ease are "weak"; used to bias pop quizzes. */
export function isWeak(p: CardProgress): boolean {
  return p.lapses >= 2 || p.ease <= 1.7;
}
