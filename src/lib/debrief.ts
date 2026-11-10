import { defineKey } from "./storage";

export type DebriefRating = "bad" | "shaky";

export interface DebriefItem {
  id: string;
  text: string;                 // "Flaring too high or too fast: ballooning, floating"
  rating: DebriefRating;
  maneuverId?: string;          // links to /maneuvers/<id> for a chair-fly
  resolved?: boolean;
}

/** What happened on one lesson, written down in under a minute. */
export interface Debrief {
  id: string;
  date: string;                 // YYYY-MM-DD
  flown: string[];              // maneuver ids
  items: DebriefItem[];         // what went badly
  cfiComments: string;
}

export const debriefsKey = defineKey<Debrief[]>("debriefs", 1, []);

export const latestDebrief = (all: Debrief[]): Debrief | undefined =>
  [...all].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))[0];
