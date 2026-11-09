import { describe, expect, it } from "vitest";
import { gradeTask, decimate } from "@/sim/scoring";
import { taskById, type TaskContext } from "@/sim/tasks";
import { initialState, readout } from "@/sim/engine";
import type { SimSnapshot } from "@/sim/types";

function ctxFrom(readouts: Partial<ReturnType<typeof readout>>[], entryOverrides: Partial<ReturnType<typeof readout>> = {}): TaskContext {
  const { state, inputs } = initialState({ altFt: 3000, iasKt: 100, hdgDeg: 360 });
  const base = readout(state);
  const entry = { ...base, ...entryOverrides };
  const samples: SimSnapshot[] = readouts.map((r, i) => ({ t: i / 10, state, readout: { ...base, ...r }, inputs, paused: false }));
  return { entry, samples, elapsed: samples.length / 10, latest: samples[samples.length - 1], memo: {} };
}

describe("scoring", () => {
  it("passes straight-and-level when within tolerance", () => {
    const task = taskById("straight-level")!;
    const ctx = ctxFrom(Array.from({ length: 1200 }, (_, i) => ({ alt: 3000 + 40 * Math.sin(i / 50), hdg: (359 + 2 * Math.cos(i / 40)) % 360, ias: 100 + 3 * Math.sin(i / 30) })));
    const res = gradeTask(task, ctx);
    expect(res.pass).toBe(true);
    expect(res.params.find((p) => p.key === "alt")!.pctInTol).toBe(1);
  });

  it("fails straight-and-level on a 150 ft excursion for a third of the time", () => {
    const task = taskById("straight-level")!;
    const ctx = ctxFrom(Array.from({ length: 1200 }, (_, i) => ({ alt: i < 400 ? 3150 : 3000, hdg: 0, ias: 100 })));
    const res = gradeTask(task, ctx);
    expect(res.pass).toBe(false);
    const alt = res.params.find((p) => p.key === "alt")!;
    expect(alt.pctInTol).toBeCloseTo(2 / 3, 2);
    expect(alt.maxDev).toBe(150);
  });

  it("uses heading wrap so 358 vs 002 is a 4° deviation", () => {
    const task = taskById("straight-level")!;
    const ctx = ctxFrom(Array.from({ length: 100 }, () => ({ alt: 3000, hdg: 358, ias: 100 })), { hdg: 2 });
    const res = gradeTask(task, ctx);
    expect(res.params.find((p) => p.key === "hdg")!.maxDev).toBeCloseTo(-4, 5);
    expect(res.pass).toBe(true);
  });

  it("applies asymmetric +10/−0 tolerance in slow flight", () => {
    const task = taskById("slow-flight")!;
    const slow = ctxFrom(Array.from({ length: 1200 }, () => ({ alt: 3000, hdg: 0, ias: 53 })));
    expect(gradeTask(task, slow).params.find((p) => p.key === "ias")!.pass).toBe(false);
    const fast = ctxFrom(Array.from({ length: 1200 }, () => ({ alt: 3000, hdg: 0, ias: 62 })));
    expect(gradeTask(task, fast).params.find((p) => p.key === "ias")!.pass).toBe(true);
  });

  it("ignores samples during the grace period", () => {
    const task = taskById("vy-climb")!;
    const ctx = ctxFrom(Array.from({ length: 600 }, (_, i) => ({ ias: i < 150 ? 100 : 74, hdg: 0, alt: 3500 })));
    expect(gradeTask(task, ctx).params.find((p) => p.key === "ias")!.pctInTol).toBe(1);
  });

  it("decimates long series", () => {
    expect(decimate(Array.from({ length: 5000 }, (_, i) => i)).length).toBe(600);
    expect(decimate([1, 2, 3])).toEqual([1, 2, 3]);
  });
});
