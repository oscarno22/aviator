import { describe, expect, it } from "vitest";
import { fromFrame, onRunway, relHeadingDeg, runwayFrom, toFrame } from "@/sim/world";
import { classifyLeg, trackPattern, type PatternSample } from "@/sim/pattern";
import { DEG_TO_RAD, FT_TO_M, NM_TO_M } from "@/lib/units";

describe("runway frame", () => {
  it("builds KJQF runway 20 from the airport data", () => {
    const f = runwayFrom("KJQF", "20");
    expect(f.hdgRad / DEG_TO_RAD).toBeCloseTo(196, 5);
    expect(f.patternSide).toBe("left");
    expect(f.lengthM).toBeCloseTo(7402 * FT_TO_M, 3);
    expect(f.patternAltM).toBeCloseTo(1700 * FT_TO_M, 3);
  });
  it("picks the runway closest to the settings heading, and falls back for an unknown airport", () => {
    expect(runwayFrom("KJQF", undefined, 20).hdgRad / DEG_TO_RAD).toBeCloseTo(16, 5);
    const g = runwayFrom("KXYZ", undefined, 90);
    expect(g.hdgRad / DEG_TO_RAD).toBeCloseTo(90, 5);
    expect(g.patternSide).toBe("left");
  });
  it("round-trips world and runway coordinates for both runway ends", () => {
    for (const id of ["02", "20"]) {
      const f = runwayFrom("KJQF", id);
      for (const [a, c] of [[0, 0], [500, 0], [-1200, 1852], [3000, -300]]) {
        const w = fromFrame(f, a, c);
        const back = toFrame(f, w.x, w.y);
        expect(back.along).toBeCloseTo(a, 6);
        expect(back.cross).toBeCloseTo(c, 6);
      }
    }
  });
  it("puts a left pattern on the left when facing the landing direction", () => {
    const f = runwayFrom("KJQF", "20"); // heading 196: left is roughly east
    const p = fromFrame(f, 0, 1000);
    expect(p.x).toBeGreaterThan(900);
    expect(relHeadingDeg(f, (196 - 90) * DEG_TO_RAD)).toBeCloseTo(90, 6);
  });
  it("knows when a point is on the pavement", () => {
    const f = runwayFrom("KJQF", "20");
    const on = fromFrame(f, 1000, 10), off = fromFrame(f, 1000, 40), short = fromFrame(f, -10, 0);
    expect(onRunway(f, on.x, on.y)).toBe(true);
    expect(onRunway(f, off.x, off.y)).toBe(false);
    expect(onRunway(f, short.x, short.y)).toBe(false);
  });
});

describe("pattern tracking", () => {
  const f = runwayFrom("KJQF", "20");
  const D = NM_TO_M;
  /** A rectangular pattern flown at 10 Hz, heading pointed along each leg. */
  function rectangle(wobbleDeg = 0): PatternSample[] {
    const out: PatternSample[] = [];
    const leg = (a0: number, c0: number, a1: number, c1: number, aglFrom: number, aglTo: number) => {
      const n = Math.round(Math.hypot(a1 - a0, c1 - c0) / 4);
      // Heading in world terms: direction of travel in the runway frame, turned back to world.
      const w0 = fromFrame(f, a0, c0), w1 = fromFrame(f, a1, c1);
      const hdg = Math.atan2(w1.x - w0.x, w1.y - w0.y);
      for (let i = 0; i < n; i++) {
        const t = i / n;
        const w = fromFrame(f, a0 + (a1 - a0) * t, c0 + (c1 - c0) * t);
        const wob = wobbleDeg * Math.sin(i / 3) * DEG_TO_RAD;
        out.push({ x: w.x, y: w.y, hdgRad: hdg + wob, aglFt: aglFrom + (aglTo - aglFrom) * t, vsFpm: 0, throttle: 0.5, onGround: false });
      }
    };
    leg(f.lengthM / 2, D, -0.6 * D, D, 1000, 800);     // downwind, past abeam
    leg(-0.6 * D, D, -0.6 * D, 0, 800, 500);           // base
    leg(-0.6 * D, 0, 100, 0, 500, 0);                  // final, over the threshold
    return out;
  }
  it("classifies a sample on each leg", () => {
    const at = (a: number, c: number, relDeg: number): PatternSample => {
      const w = fromFrame(f, a, c);
      const hdg = f.hdgRad + (f.patternSide === "left" ? -relDeg : relDeg) * DEG_TO_RAD;
      return { x: w.x, y: w.y, hdgRad: hdg, aglFt: 800, vsFpm: 0, throttle: 0.5, onGround: false };
    };
    expect(classifyLeg(f, at(500, 0, 0))).toBe("upwind");
    expect(classifyLeg(f, at(-1000, 0, 0))).toBe("final");
    expect(classifyLeg(f, at(0, D, 180))).toBe("downwind");
    expect(classifyLeg(f, at(-1000, 900, -90))).toBe("base");
    expect(classifyLeg(f, at(3000, 900, 90))).toBe("crosswind");
  });
  it("fires the gates in order on a clean rectangle", () => {
    const t = trackPattern(f, rectangle());
    const g = t.gates;
    expect(t.lost).toBeNull();
    for (const id of ["abeam", "baseTurn", "finalEstablished", "agl300", "threshold"] as const) expect(g[id], id).toBeTypeOf("number");
    expect(g.abeam!).toBeLessThan(g.baseTurn!);
    expect(g.baseTurn!).toBeLessThan(g.finalEstablished!);
    expect(g.finalEstablished!).toBeLessThanOrEqual(g.threshold!);
    expect(t.leg).toBe("final");
  });
  it("does not go back a leg on a heading wobble", () => {
    const t = trackPattern(f, rectangle(25));
    expect(t.lost).toBeNull();
    expect(t.leg).toBe("final");
    expect(t.gates.threshold).toBeTypeOf("number");
  });
  it("gives up on a flight that is not a pattern", () => {
    // Short of the runway and well off to the side, pointed at the runway heading: fits no leg.
    const w = fromFrame(f, -3000, 2000);
    const t = trackPattern(f, [{ x: w.x, y: w.y, hdgRad: f.hdgRad, aglFt: 2000, vsFpm: 0, throttle: 0.5, onGround: false }]);
    expect(t.lost).not.toBeNull();
  });
});
