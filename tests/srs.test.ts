import { describe, expect, it } from "vitest";
import { addDays, grade, isDue, newProgress, isWeak } from "@/lib/srs";

const T = "2026-09-25";

describe("srs", () => {
  it("new cards are due today", () => {
    expect(isDue(newProgress("a", T), T)).toBe(true);
  });

  it("good grows the interval 1 → 3 → ~7", () => {
    let p = newProgress("a", T);
    p = grade(p, "good", T);
    expect(p.intervalDays).toBe(1);
    expect(p.due).toBe(addDays(T, 1));
    p = grade(p, "good", p.due);
    expect(p.intervalDays).toBe(3);
    p = grade(p, "good", p.due);
    expect(p.intervalDays).toBe(Math.round(3 * 2.5));
  });

  it("again resets and stays due today, lowering ease", () => {
    let p = newProgress("a", T);
    p = grade(p, "good", T);
    p = grade(p, "good", p.due);
    const day = p.due;
    p = grade(p, "again", day);
    expect(p.intervalDays).toBe(0);
    expect(p.due).toBe(day);
    expect(p.reps).toBe(0);
    expect(p.lapses).toBe(1);
    expect(p.ease).toBeCloseTo(2.3);
  });

  it("ease is clamped and intervals are capped", () => {
    let p = newProgress("a", T);
    for (let i = 0; i < 20; i++) p = grade(p, "again", T);
    expect(p.ease).toBe(1.3);
    expect(isWeak(p)).toBe(true);
    let q = newProgress("b", T);
    for (let i = 0; i < 12; i++) q = grade(q, "easy", q.due);
    expect(q.intervalDays).toBeLessThanOrEqual(180);
    expect(q.ease).toBe(2.5);
  });

  it("addDays handles month rollover", () => {
    expect(addDays("2026-01-30", 3)).toBe("2026-02-02");
  });
});
