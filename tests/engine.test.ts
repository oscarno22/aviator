import { describe, expect, it } from "vitest";
import { FIXED_DT, initialState, readout, step, zeroGust } from "@/sim/engine";
import { alphaStall, clMax } from "@/sim/aircraft/c172s";
import { RAD_TO_DEG, angleDiff, clamp } from "@/lib/units";
import type { ControlInputs, SimState } from "@/sim/types";

function run(state: SimState, inputs: ControlInputs, seconds: number, control?: (s: SimState, u: ControlInputs, t: number) => ControlInputs) {
  const gust = zeroGust();
  let s = state, u = inputs;
  const n = Math.round(seconds / FIXED_DT);
  for (let i = 0; i < n; i++) {
    if (control) u = control(s, u, s.t);
    s = step(s, u, FIXED_DT, {}, gust);
  }
  return { s, u };
}

/** Cascaded altitude hold: altitude error → vertical-speed command → elevator (uses unlagged VS). */
function holdAltitude(targetFt: number) {
  let integ = 0;
  return (s: SimState, u: ControlInputs): ControlInputs => {
    const r = readout(s);
    const vsNow = s.tas * Math.sin(s.gamma) * 196.85;
    const vsCmd = clamp((targetFt - r.alt) * 4, -700, 700);
    const e = vsCmd - vsNow;
    integ = clamp(integ + e * FIXED_DT * 0.00002, -0.5, 0.5);
    return { ...u, elevator: clamp(e * 0.0004 + integ, -1, 1) };
  };
}

describe("c172s model", () => {
  it("calibrates CLmax so stall alpha is sensible", () => {
    expect(clMax(0)).toBeGreaterThan(1.6);
    expect(clMax(0)).toBeLessThan(1.9);
    expect(clMax(30)).toBeGreaterThan(2.4);
    expect(alphaStall(0) * RAD_TO_DEG).toBeGreaterThan(15);
    expect(alphaStall(0) * RAD_TO_DEG).toBeLessThan(21);
  });

  it("trimFor gives hands-off level flight for 30 s", () => {
    const { state, inputs } = initialState({ altFt: 3000, iasKt: 100 });
    const { s } = run(state, inputs, 30);
    const r0 = readout(state), r1 = readout(s);
    expect(Math.abs(r1.alt - r0.alt)).toBeLessThan(40);
    expect(Math.abs(r1.ias - r0.ias)).toBeLessThan(2);
    expect(Math.abs(angleDiff(r1.hdg, r0.hdg))).toBeLessThan(2);
  });

  it("stalls near 48 KIAS clean and near 40 with flaps 30 (at sim weight)", () => {
    // At 2400 lb the POH 2550-lb numbers scale by sqrt(2400/2550) ≈ 0.97 → ~46.6 and ~38.8.
    for (const [flaps, expected] of [[0, 46.6], [30, 38.8]] as const) {
      const { state, inputs } = initialState({ altFt: 3000, iasKt: 65, flaps });
      let stallIas = 0;
      let s = state;
      const gust = zeroGust();
      const u = { ...inputs, throttle: 0 };
      for (let i = 0; i < 60 * 60 && !stallIas; i++) {
        const elev = Math.min(1, (i / 60) * 0.06); // slow pull, ~1 % per second
        s = step(s, { ...u, elevator: elev }, FIXED_DT, {}, gust);
        if (s.stalled) stallIas = readout(s).ias;
      }
      expect(stallIas).toBeGreaterThan(expected - 4);
      expect(stallIas).toBeLessThan(expected + 4);
    }
  });

  it("climbs 600–900 fpm at Vy with full throttle, hands off", () => {
    const { state, inputs } = initialState({ altFt: 2000, iasKt: 74 });
    let s = state; const gust = zeroGust(); let sum = 0, n = 0;
    for (let i = 0; i < 90 * 60; i++) {
      s = step(s, { ...inputs, throttle: 1 }, FIXED_DT, {}, gust);
      if (i >= 60 * 60) { sum += s.tas * Math.sin(s.gamma) * 196.85; n++; }
    }
    const r = readout(s);
    expect(r.ias).toBeGreaterThan(66);
    expect(r.ias).toBeLessThan(82);
    expect(sum / n).toBeGreaterThan(600);
    expect(sum / n).toBeLessThan(900);
  });

  it("holds ~1.41 g in a level 45° turn", () => {
    const { state, inputs } = initialState({ altFt: 3000, iasKt: 100 });
    const hold = holdAltitude(3000);
    const { s } = run(state, inputs, 40, (st, u) => {
      const r = readout(st);
      const ail = clamp((45 - r.bank) * 0.05, -1, 1);
      return { ...hold(st, u), aileron: ail, throttle: 0.75 };
    });
    const r = readout(s);
    expect(r.bank).toBeGreaterThan(40);
    expect(r.bank).toBeLessThan(50);
    expect(s.nz).toBeGreaterThan(1.3);
    expect(s.nz).toBeLessThan(1.55);
    expect(r.turnRate).toBeGreaterThan(5); // faster than standard rate
  });

  it("reaches 115–128 KTAS at full throttle level flight near sea level", () => {
    const { state, inputs } = initialState({ altFt: 1000, iasKt: 100 });
    const { s } = run(state, { ...inputs, throttle: 1 }, 150, holdAltitude(1000));
    const r = readout(s);
    expect(Math.abs(r.alt - 1000)).toBeLessThan(150);
    expect(r.tas).toBeGreaterThan(115);
    expect(r.tas).toBeLessThan(128);
  });

  it("engine out: rpm windmills, glide at 68 sinks 500–800 fpm hands off", () => {
    const { state, inputs } = initialState({ altFt: 4000, iasKt: 68, engineOut: true });
    let s = state; const gust = zeroGust(); let sum = 0, n = 0;
    for (let i = 0; i < 60 * 60; i++) {
      s = step(s, inputs, FIXED_DT, {}, gust);
      if (i >= 28 * 60) { sum += s.tas * Math.sin(s.gamma) * 196.85; n++; }
    }
    expect(readout(s).rpm).toBeLessThan(950);
    expect(sum / n).toBeLessThan(-500);
    expect(sum / n).toBeGreaterThan(-800);
  });

  it("never produces NaN under 60 s of random full-deflection abuse", () => {
    const { state, inputs } = initialState({ altFt: 5000, iasKt: 90 });
    let seed = 42;
    const rng = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
    const { s } = run(state, inputs, 60, (st, u) => ({
      ...u,
      elevator: rng() * 2 - 1, aileron: rng() * 2 - 1, rudder: rng() * 2 - 1,
      throttle: rng(), flaps: ([0, 10, 20, 30] as const)[Math.floor(rng() * 4)],
    }));
    for (const v of Object.values(s)) if (typeof v === "number") expect(Number.isFinite(v)).toBe(true);
  });

  it("overbanks past 35° hands-off and self-levels below", () => {
    const { state, inputs } = initialState({ altFt: 3000, iasKt: 100, bankDeg: 20 });
    const { s: a } = run(state, inputs, 10);
    expect(Math.abs(readout(a).bank)).toBeLessThan(20);
    const steep = initialState({ altFt: 3000, iasKt: 100, bankDeg: 50 });
    const { s: b } = run(steep.state, steep.inputs, 5);
    expect(readout(b).bank).toBeGreaterThan(50);
  });
});
