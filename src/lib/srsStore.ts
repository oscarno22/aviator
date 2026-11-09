import { defineKey } from "./storage";
import { isDue, isWeak, newProgress, todayStr, type CardProgress } from "./srs";
import { CONCEPTS, type ConceptCard } from "@/data/concepts";

/** Progress per card id (concept cards and cockpit items share this store). */
export const srsKey = defineKey<Record<string, CardProgress>>("srs", 1, {});

export const NEW_PER_SESSION = 15;

export function progressFor(all: Record<string, CardProgress>, id: string, today = todayStr()): CardProgress {
  return all[id] ?? newProgress(id, today);
}

/** Due review cards first (oldest due first), then a limited batch of never-seen cards. */
export function buildReviewQueue(all: Record<string, CardProgress>, cards: ConceptCard[] = CONCEPTS, today = todayStr()): ConceptCard[] {
  const seen = cards.filter((c) => all[c.id]);
  const due = seen.filter((c) => isDue(all[c.id], today)).sort((a, b) => (all[a.id].due < all[b.id].due ? -1 : 1));
  const fresh = cards.filter((c) => !all[c.id]).slice(0, NEW_PER_SESSION);
  return [...due, ...fresh];
}

export function dueCount(all: Record<string, CardProgress>, cards: ConceptCard[] = CONCEPTS, today = todayStr()): { due: number; fresh: number; learned: number } {
  let due = 0, fresh = 0, learned = 0;
  for (const c of cards) {
    const p = all[c.id];
    if (!p) fresh++;
    else {
      if (isDue(p, today)) due++;
      if (p.intervalDays >= 7) learned++;
    }
  }
  return { due, fresh, learned };
}

export function weakTags(all: Record<string, CardProgress>, cards: ConceptCard[] = CONCEPTS): string[] {
  const areas = new Map<string, number>();
  for (const c of cards) {
    const p = all[c.id];
    if (p && isWeak(p)) areas.set(c.area, (areas.get(c.area) ?? 0) + 1);
  }
  return [...areas.entries()].sort((a, b) => b[1] - a[1]).map(([a]) => a).slice(0, 4);
}

export function shuffle<T>(arr: T[], seed = Math.random()): T[] {
  const a = [...arr];
  let s = Math.floor(seed * 2 ** 31) || 1;
  const rnd = () => (s = (s * 48271) % 2147483647) / 2147483647;
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Cards the student saved from a pop quiz ("add to review deck"). */
export const customCardsKey = defineKey<ConceptCard[]>("custom-cards", 1, []);
