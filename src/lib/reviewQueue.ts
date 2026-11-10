/**
 * One review queue for everything due or weak. Nothing here is stored: the queue is
 * derived from the shared srs store, the sim results and the lesson debriefs.
 */
import { CONCEPTS, type ConceptCard } from "@/data/concepts";
import { ORAL_BANK, type OralQuestion } from "@/data/oralBank";
import { RADIO_SCENARIOS } from "@/data/radioScenarios";
import { MANEUVERS } from "@/data/maneuvers";
import type { Debrief, DebriefItem } from "./debrief";
import { reviewId, type ReviewKind } from "./review";
import { addDays, isDue, isWeak, type CardProgress } from "./srs";
import { defineKey } from "./storage";

export interface ReviewItem {
  id: string;                 // srs id
  kind: ReviewKind;
  title: string;
  detail?: string;
  due: string;
  overdueDays: number;
  weak: boolean;
  estMin: number;
  fromLatestLesson?: boolean;
  doneToday: boolean;         // attempted today (it may still be due if it went badly)
  href?: string;              // where to do it, for items that are not answered inline
  card?: ConceptCard;
  oral?: OralQuestion;
  debrief?: { debriefId: string; item: DebriefItem };
}

export interface QueueSources {
  srs: Record<string, CardProgress>;
  custom: ConceptCard[];
  simResults: { taskId: string; title: string; pass: boolean; startedAt: string }[];
  debriefs: Debrief[];
  today: string;
}

const EST_MIN: Record<ReviewKind, number> = { card: 0.5, oral: 1, debrief: 1.5, radio: 3, sim: 3 };

function daysBetween(from: string, to: string): number {
  const d = (s: string) => { const [y, m, dd] = s.split("-").map(Number); return Date.UTC(y, m - 1, dd); };
  return Math.round((d(to) - d(from)) / 86_400_000);
}

export function buildQueue({ srs, custom, simResults, debriefs, today }: QueueSources): ReviewItem[] {
  const items: ReviewItem[] = [];
  const base = (id: string, kind: ReviewKind, due: string, p: CardProgress | undefined) => ({
    id, kind, due, overdueDays: Math.max(0, daysBetween(due, today)), weak: !!p && isWeak(p), estMin: EST_MIN[kind], doneToday: p?.last === today,
  });
  // An item belongs in today's queue if it is due, or was attempted today (so the list can show it as done).
  const live = (p: CardProgress | undefined) => !!p && (isDue(p, today) || p.last === today);

  for (const c of [...CONCEPTS, ...custom]) {
    const p = srs[c.id];
    if (live(p)) items.push({ ...base(c.id, "card", p.due, p), title: c.q, card: c });
  }
  for (const q of ORAL_BANK) {
    const id = reviewId("oral", q.id), p = srs[id];
    if (live(p)) items.push({ ...base(id, "oral", p.due, p), title: q.q, oral: q, href: `/oral?area=${q.areaId}` });
  }
  for (const s of RADIO_SCENARIOS) {
    const id = reviewId("radio", s.id), p = srs[id];
    if (live(p)) items.push({ ...base(id, "radio", p.due, p), title: s.title, detail: "Radio drill", href: `/radio?scenario=${s.id}` });
  }

  // Sim tasks: scheduled through srs once flown with this feature; older results count if the latest attempt failed.
  const latest = new Map<string, QueueSources["simResults"][number]>();
  for (const r of simResults) { const prev = latest.get(r.taskId); if (!prev || r.startedAt > prev.startedAt) latest.set(r.taskId, r); }
  for (const [taskId, r] of latest) {
    const id = reviewId("sim", taskId), p = srs[id];
    if (p ? live(p) : !r.pass) {
      const due = p?.due ?? r.startedAt.slice(0, 10);
      items.push({ ...base(id, "sim", due > today ? today : due, p), title: r.title, detail: "Sim task", href: `/sim?task=${taskId}` });
    }
  }

  const newest = [...debriefs].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  for (const d of debriefs) {
    for (const it of d.items) {
      const id = reviewId("debrief", it.id), p = srs[id];
      const due = p?.due ?? (it.rating === "bad" ? d.date : addDays(d.date, 1));
      if (it.resolved ? p?.last !== today : due > today && p?.last !== today) continue;
      const m = MANEUVERS.find((x) => x.id === it.maneuverId);
      items.push({
        ...base(id, "debrief", due > today ? today : due, p), weak: it.rating === "bad" || (!!p && isWeak(p)),
        title: it.text, detail: m ? `From your ${d.date} lesson · ${m.name}` : `From your ${d.date} lesson`,
        href: m ? `/maneuvers/${m.id}` : undefined, fromLatestLesson: d.id === newest?.id, debrief: { debriefId: d.id, item: it },
      });
    }
  }
  return items.sort((a, b) => score(b) - score(a) || (a.id < b.id ? -1 : 1));
}

/** Higher is more urgent. */
export function score(it: ReviewItem): number {
  return (it.fromLatestLesson ? 100 : 0) + Math.min(40, it.overdueDays * 5) + (it.weak ? 20 : 0) + (it.kind === "debrief" ? 10 : 0);
}

export const WARMUP_BUDGET_MIN = 12;
const MAX_PER_KIND: Record<ReviewKind, number> = { card: 6, oral: 3, debrief: 3, radio: 1, sim: 1 };

/** Pick a short pre-lesson set: most urgent first, inside a time budget, with some of every kind. */
export function buildWarmup(queue: ReviewItem[], budgetMin = WARMUP_BUDGET_MIN): ReviewItem[] {
  const open = queue.filter((i) => !i.doneToday);
  const picked: ReviewItem[] = [];
  const count: Record<ReviewKind, number> = { card: 0, oral: 0, debrief: 0, radio: 0, sim: 0 };
  let minutes = 0;
  const take = (it: ReviewItem) => { picked.push(it); count[it.kind]++; minutes += it.estMin; };
  // One radio drill and one sim task first if any are waiting: they are what cards cannot rehearse.
  for (const kind of ["radio", "sim"] as const) { const it = open.find((i) => i.kind === kind); if (it) take(it); }
  for (const it of open) {
    if (picked.includes(it) || count[it.kind] >= MAX_PER_KIND[it.kind]) continue;
    if (minutes + it.estMin > budgetMin) continue;
    take(it);
  }
  return picked.sort((a, b) => score(b) - score(a) || (a.id < b.id ? -1 : 1));
}

/** Today's warm-up is fixed once started, so finishing an item does not pull a new one in. */
export const warmupKey = defineKey<{ date: string; ids: string[] }>("warmup", 1, { date: "", ids: [] });

export function queueSummary(queue: ReviewItem[]) {
  const open = queue.filter((i) => !i.doneToday);
  const byKind: Record<ReviewKind, number> = { card: 0, oral: 0, debrief: 0, radio: 0, sim: 0 };
  for (const i of open) byKind[i.kind]++;
  return { open: open.length, done: queue.length - open.length, byKind };
}
