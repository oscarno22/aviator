/**
 * One scheduling store for everything reviewable. Concept and cockpit cards keep
 * their bare ids; other sources get a namespaced id in the same `srs` record.
 */
import { grade, todayStr, type Grade } from "./srs";
import { progressFor, srsKey } from "./srsStore";
import { update } from "./storage";

export type ReviewKind = "card" | "oral" | "radio" | "sim" | "debrief";

export function reviewId(kind: Exclude<ReviewKind, "card">, id: string): string {
  return `${kind}:${id}`;
}

export function kindOf(id: string): ReviewKind {
  const m = /^(oral|radio|sim|debrief):/.exec(id);
  return m ? (m[1] as ReviewKind) : "card";
}

/** Record a graded attempt against the shared spaced-repetition store. */
export function recordOutcome(id: string, g: Grade, today = todayStr()): void {
  update(srsKey, (all) => ({ ...all, [id]: grade(progressFor(all, id, today), g, today) }));
}
