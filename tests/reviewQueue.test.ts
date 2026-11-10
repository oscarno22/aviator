import { describe, expect, it } from "vitest";
import { buildQueue, buildWarmup, queueSummary, type QueueSources } from "@/lib/reviewQueue";
import { CONCEPTS } from "@/data/concepts";
import { ORAL_BANK } from "@/data/oralBank";
import { grade, newProgress, type CardProgress } from "@/lib/srs";
import type { Debrief } from "@/lib/debrief";

const today = "2026-11-09";
const due = (id: string, dueDate: string, extra: Partial<CardProgress> = {}): CardProgress => ({ ...newProgress(id, "2026-11-01"), due: dueDate, last: "2026-11-01", ...extra });
const src = (over: Partial<QueueSources> = {}): QueueSources => ({ srs: {}, custom: [], simResults: [], debriefs: [], today, ...over });
const debrief = (over: Partial<Debrief> = {}): Debrief => ({
  id: "d1", date: "2026-11-08", flown: ["normal-landing"], cfiComments: "",
  items: [{ id: "i1", text: "Flaring too high", rating: "bad", maneuverId: "normal-landing" }, { id: "i2", text: "Late on the radio", rating: "shaky" }], ...over,
});

describe("buildQueue", () => {
  it("is empty with no history", () => {
    expect(buildQueue(src())).toEqual([]);
  });
  it("adapts every source under one id scheme with no duplicates", () => {
    const c = CONCEPTS[0], q = ORAL_BANK[0];
    const queue = buildQueue(src({
      srs: {
        [c.id]: due(c.id, "2026-11-05"),
        [`oral:${q.id}`]: due(`oral:${q.id}`, today),
        "radio:towered-taxi": due("radio:towered-taxi", "2026-11-07"),
        "sim:steep-turn": due("sim:steep-turn", "2026-11-08"),
        [CONCEPTS[1].id]: due(CONCEPTS[1].id, "2026-12-01"), // not due
      },
      simResults: [{ taskId: "steep-turn", title: "Steep turn", pass: false, startedAt: "2026-11-08T10:00:00Z" }],
      debriefs: [debrief()],
    }));
    expect(queue.map((i) => i.kind).sort()).toEqual(["card", "debrief", "debrief", "oral", "radio", "sim"]);
    expect(new Set(queue.map((i) => i.id)).size).toBe(queue.length);
    expect(queue.find((i) => i.kind === "radio")!.href).toBe("/radio?scenario=towered-taxi");
    expect(queue.find((i) => i.kind === "card")!.overdueDays).toBe(4);
  });
  it("surfaces a failed sim task flown before scheduling existed, but not a passed one", () => {
    const q = buildQueue(src({ simResults: [
      { taskId: "slow-flight", title: "Slow flight", pass: true, startedAt: "2026-11-01T10:00:00Z" },
      { taskId: "slow-flight", title: "Slow flight", pass: false, startedAt: "2026-11-02T10:00:00Z" },
      { taskId: "descent", title: "Descent", pass: true, startedAt: "2026-11-02T10:00:00Z" },
    ] }));
    expect(q.map((i) => i.id)).toEqual(["sim:slow-flight"]);
  });
  it("puts the latest lesson's problems first and holds a shaky item until the next day", () => {
    const c = CONCEPTS[0];
    const q = buildQueue(src({ srs: { [c.id]: due(c.id, "2026-10-01") }, debriefs: [debrief()] }));
    expect(q[0].kind).toBe("debrief");
    const sameDay = buildQueue(src({ today: "2026-11-08", debriefs: [debrief()] }));
    expect(sameDay.map((i) => i.title)).toEqual(["Flaring too high"]);
  });
  it("drops resolved debrief items", () => {
    const d = debrief({ items: [{ id: "i1", text: "Flaring too high", rating: "bad", resolved: true }] });
    expect(buildQueue(src({ debriefs: [d] }))).toEqual([]);
  });
  it("keeps an item attempted today in the list, marked done", () => {
    const c = CONCEPTS[0];
    const p = grade(due(c.id, "2026-11-05"), "again", today); // still due today
    const q = buildQueue(src({ srs: { [c.id]: p } }));
    expect(q).toHaveLength(1);
    expect(q[0].doneToday).toBe(true);
    expect(queueSummary(q)).toMatchObject({ open: 0, done: 1 });
  });
});

describe("buildWarmup", () => {
  const big = () => {
    const srs: Record<string, CardProgress> = {};
    for (const c of CONCEPTS.slice(0, 30)) srs[c.id] = due(c.id, "2026-11-05");
    for (const q of ORAL_BANK.slice(0, 10)) srs[`oral:${q.id}`] = due(`oral:${q.id}`, "2026-11-06");
    srs["radio:towered-taxi"] = due("radio:towered-taxi", today);
    srs["radio:ctaf-pattern"] = due("radio:ctaf-pattern", today);
    return buildQueue(src({ srs, debriefs: [debrief()], simResults: [{ taskId: "steep-turn", title: "Steep turn", pass: false, startedAt: "2026-11-08T10:00:00Z" }] }));
  };
  it("stays inside the time budget and the per-kind caps", () => {
    const w = buildWarmup(big());
    expect(w.reduce((m, i) => m + i.estMin, 0)).toBeLessThanOrEqual(12);
    const n = (k: string) => w.filter((i) => i.kind === k).length;
    expect(n("radio")).toBe(1);
    expect(n("sim")).toBe(1);
    expect(n("oral")).toBeLessThanOrEqual(3);
    expect(n("card")).toBeLessThanOrEqual(6);
    expect(n("debrief")).toBe(2);
  });
  it("leads with the last lesson and is the same every time for the same data", () => {
    const a = buildWarmup(big()), b = buildWarmup(big());
    expect(a[0].kind).toBe("debrief");
    expect(a.map((i) => i.id)).toEqual(b.map((i) => i.id));
  });
  it("skips items already done today", () => {
    const c = CONCEPTS[0];
    const q = buildQueue(src({ srs: { [c.id]: grade(due(c.id, "2026-11-05"), "again", today) } }));
    expect(buildWarmup(q)).toEqual([]);
  });
});
