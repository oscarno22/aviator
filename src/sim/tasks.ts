/**
 * Practice tasks graded against Private Pilot ACS tolerances.
 * Units in TaskParam are aviation units from InstrumentReadout.
 */
import { initialState } from "./engine";
import type { ControlInputs, InstrumentReadout, SimSnapshot, SimState } from "./types";
import { angleDiff } from "@/lib/units";

export type ParamKey = "alt" | "hdg" | "ias" | "bank" | "vs" | "turnRate" | "ball";

export interface TaskParam {
  key: ParamKey;
  label: string;
  unit: "ft" | "deg" | "kt" | "fpm" | "deg/s" | "ball";
  target: number | "entry";
  tol: number;
  tolLow?: number;   // asymmetric: allowed below target (positive number)
  tolHigh?: number;  // asymmetric: allowed above target
  graceSec?: number; // samples before this are ignored
  wrap?: boolean;    // heading arithmetic
  minPct?: number;   // pass threshold override (default 0.9)
}

export interface TaskSetup { state: SimState; inputs: ControlInputs; coverInstrumentsSec?: number }
export interface Finding { severity: "info" | "warn" | "fail"; text: string }
export interface TaskContext {
  entry: InstrumentReadout;
  samples: SimSnapshot[];  // 10 Hz
  elapsed: number;
  latest: SimSnapshot;
  /** Free-form scratch space for isComplete/event bookkeeping. */
  memo: Record<string, number | boolean | undefined>;
}

export interface PracticeTask {
  id: string;
  title: string;
  acsRef: string;
  description: string;
  briefing: string[];
  setup(): TaskSetup;
  params: TaskParam[];
  durationSec?: number;   // hard stop
  isComplete(ctx: TaskContext): boolean;
  /** Called each sample; may inject a state change (e.g. engine failure). */
  event?(ctx: TaskContext): Partial<SimState> | null;
  extraFindings?(ctx: TaskContext): Finding[];
  hud?(ctx: TaskContext): string;
}

const ENTRY_ALT = 3000;
const stable = (ctx: TaskContext, secs: number, ok: (r: InstrumentReadout, s: SimSnapshot) => boolean) => {
  const n = Math.round(secs * 10);
  if (ctx.samples.length < n) return false;
  for (let i = ctx.samples.length - n; i < ctx.samples.length; i++) if (!ok(ctx.samples[i].readout, ctx.samples[i])) return false;
  return true;
};
const vsNow = (s: SimSnapshot) => s.state.tas * Math.sin(s.state.gamma) * 196.85;
const cumulativeTurn = (ctx: TaskContext) => {
  let sum = 0;
  for (let i = 1; i < ctx.samples.length; i++) sum += angleDiff(ctx.samples[i].readout.hdg, ctx.samples[i - 1].readout.hdg);
  return sum;
};
const altLoss = (ctx: TaskContext, fromIndex: number) => {
  let min = Infinity;
  for (let i = fromIndex; i < ctx.samples.length; i++) min = Math.min(min, ctx.samples[i].readout.alt);
  return ctx.samples[fromIndex].readout.alt - min;
};

export const TASKS: PracticeTask[] = [
  {
    id: "straight-level",
    title: "Straight-and-level",
    acsRef: "PA.VIII.A (instrument) / PA.V",
    description: "Hold altitude, heading and airspeed for two minutes by reference to the instruments.",
    briefing: ["3,000 ft, 100 knots, heading 360, trimmed.", "Scan: attitude, altimeter, attitude, heading, attitude, airspeed.", "Small corrections. Half a bar width for 100 ft."],
    setup: () => ({ ...initialState({ altFt: ENTRY_ALT, iasKt: 100, hdgDeg: 360 }) }),
    params: [
      { key: "alt", label: "Altitude", unit: "ft", target: "entry", tol: 100 },
      { key: "hdg", label: "Heading", unit: "deg", target: "entry", tol: 10, wrap: true },
      { key: "ias", label: "Airspeed", unit: "kt", target: "entry", tol: 10 },
    ],
    durationSec: 120,
    isComplete: (ctx) => ctx.elapsed >= 120,
    hud: (ctx) => `Hold 3,000 ft · 360° · 100 kt · ${Math.max(0, 120 - Math.floor(ctx.elapsed))} s left`,
  },
  {
    id: "std-rate-turn",
    title: "Standard-rate turn to a heading",
    acsRef: "PA.VIII.D",
    description: "Turn right from 360 to 090 at standard rate (3°/s), holding altitude and airspeed, and roll out on heading.",
    briefing: ["3,000 ft, 100 knots, heading 360.", "Roll to about 15° bank: wing on the turn coordinator index.", "Lead the rollout by about 7°. Level wings on 090."],
    setup: () => ({ ...initialState({ altFt: ENTRY_ALT, iasKt: 100, hdgDeg: 360 }) }),
    params: [
      { key: "alt", label: "Altitude", unit: "ft", target: "entry", tol: 100 },
      { key: "ias", label: "Airspeed", unit: "kt", target: "entry", tol: 10 },
      { key: "turnRate", label: "Turn rate", unit: "deg/s", target: 3, tol: 1.2, graceSec: 6, minPct: 0.7 },
    ],
    durationSec: 90,
    isComplete: (ctx) => ctx.elapsed > 15 && stable(ctx, 3, (r) => Math.abs(angleDiff(r.hdg, 90)) <= 10 && Math.abs(r.bank) < 5),
    extraFindings: (ctx) => {
      const r = ctx.latest.readout;
      const err = angleDiff(r.hdg, 90);
      return [Math.abs(err) <= 10
        ? { severity: "info", text: `Rolled out ${Math.abs(err).toFixed(0)}° from 090.` }
        : { severity: "fail", text: `Rolled out ${Math.abs(err).toFixed(0)}° from the assigned heading (limit 10°).` }];
    },
    hud: () => "Right turn to 090 at standard rate · hold 3,000 ft and 100 kt",
  },
  {
    id: "steep-turn",
    title: "Steep turn, 360° at 45°",
    acsRef: "PA.V.A",
    description: "A full circle at 45° bank, ±100 ft, ±10 kt, rolling out on the entry heading ±10°.",
    briefing: ["3,000 ft, 100 knots (below Va), heading 360.", "Roll in smoothly; add a little power and back pressure passing 30°.", "Watch the overbanking tendency past 35°. Lead the rollout by 20°."],
    setup: () => ({ ...initialState({ altFt: ENTRY_ALT, iasKt: 100, hdgDeg: 360 }) }),
    params: [
      { key: "alt", label: "Altitude", unit: "ft", target: "entry", tol: 100 },
      { key: "ias", label: "Airspeed", unit: "kt", target: "entry", tol: 10 },
      { key: "bank", label: "Bank", unit: "deg", target: 45, tol: 5, graceSec: 6, minPct: 0.75 },
    ],
    durationSec: 120,
    isComplete: (ctx) => Math.abs(cumulativeTurn(ctx)) >= 345 && stable(ctx, 2, (r) => Math.abs(r.bank) < 8),
    extraFindings: (ctx) => {
      const err = Math.abs(angleDiff(ctx.latest.readout.hdg, ctx.entry.hdg));
      const out: Finding[] = [err <= 10
        ? { severity: "info", text: `Rolled out ${err.toFixed(0)}° from the entry heading.` }
        : { severity: "fail", text: `Rolled out ${err.toFixed(0)}° from the entry heading (limit 10°).` }];
      const maxG = Math.max(...ctx.samples.map((s) => s.readout.g));
      if (maxG > 2.0) out.push({ severity: "warn", text: `Peak load factor ${maxG.toFixed(2)} g: you pulled hard chasing altitude.` });
      return out;
    },
    hud: (ctx) => `45° bank · ${Math.abs(cumulativeTurn(ctx)).toFixed(0)}° of 360° · hold 3,000 ft and 100 kt`,
  },
  {
    id: "vy-climb",
    title: "Climb at Vy and level off",
    acsRef: "PA.VIII.B",
    description: "Full power, climb 1,000 ft at 74 knots holding heading, and level off at 3,500 ft within 100 ft.",
    briefing: ["Start at 2,500 ft, 100 knots, heading 360.", "Full throttle, pitch up to about 8°, let it slow to 74, trim. Right rudder.", "Lead the level-off by about 70 ft: lower the nose, accelerate, then reduce power to cruise."],
    setup: () => ({ ...initialState({ altFt: 2500, iasKt: 100, hdgDeg: 360 }) }),
    params: [
      { key: "ias", label: "Airspeed", unit: "kt", target: 74, tol: 10, graceSec: 15 },
      { key: "hdg", label: "Heading", unit: "deg", target: "entry", tol: 10, wrap: true },
    ],
    durationSec: 240,
    isComplete: (ctx) => ctx.elapsed > 30 && stable(ctx, 5, (r, s) => Math.abs(r.alt - 3500) <= 100 && Math.abs(vsNow(s)) < 200),
    extraFindings: (ctx) => {
      const maxAlt = Math.max(...ctx.samples.map((s) => s.readout.alt));
      const r = ctx.latest.readout;
      const out: Finding[] = [];
      if (maxAlt > 3600) out.push({ severity: "fail", text: `Overshot the level-off by ${(maxAlt - 3500).toFixed(0)} ft (limit 100).` });
      else out.push({ severity: "info", text: `Leveled at ${r.alt.toFixed(0)} ft.` });
      if (ctx.elapsed >= 240) out.push({ severity: "fail", text: "Did not reach and hold 3,500 ft in time." });
      return out;
    },
    hud: (ctx) => `Full power, 74 kt, heading 360 · ${Math.max(0, 3500 - ctx.latest.readout.alt).toFixed(0)} ft to go`,
  },
  {
    id: "descent",
    title: "Constant-airspeed descent",
    acsRef: "PA.VIII.C",
    description: "Descend 1,000 ft at 90 knots and about 500 fpm, holding heading, and level off at 3,000 ft.",
    briefing: ["Start at 4,000 ft, 100 knots, heading 360.", "Power to about 1,700 rpm, hold pitch, let the airspeed settle at 90; then pitch for airspeed, power for rate.", "Lead the level-off: add power first, then raise the nose. Trim."],
    setup: () => ({ ...initialState({ altFt: 4000, iasKt: 100, hdgDeg: 360 }) }),
    params: [
      { key: "ias", label: "Airspeed", unit: "kt", target: 90, tol: 10, graceSec: 15 },
      { key: "hdg", label: "Heading", unit: "deg", target: "entry", tol: 10, wrap: true },
      { key: "vs", label: "Descent rate", unit: "fpm", target: -500, tol: 200, graceSec: 15, minPct: 0.6 },
    ],
    durationSec: 240,
    isComplete: (ctx) => ctx.elapsed > 30 && stable(ctx, 5, (r, s) => Math.abs(r.alt - 3000) <= 100 && Math.abs(vsNow(s)) < 200),
    extraFindings: (ctx) => {
      const minAlt = Math.min(...ctx.samples.map((s) => s.readout.alt));
      return minAlt < 2900
        ? [{ severity: "fail", text: `Went ${(3000 - minAlt).toFixed(0)} ft below the level-off altitude (limit 100).` }]
        : [{ severity: "info", text: `Leveled at ${ctx.latest.readout.alt.toFixed(0)} ft.` }];
    },
    hud: (ctx) => `90 kt, ~500 fpm down, heading 360 · ${Math.max(0, ctx.latest.readout.alt - 3000).toFixed(0)} ft to go`,
  },
  {
    id: "slow-flight",
    title: "Slow flight",
    acsRef: "PA.VII.A",
    description: "Flaps 30, slow to 55 knots and hold altitude and heading for 90 seconds without the stall horn.",
    briefing: ["Start at 3,000 ft, 65 knots, flaps 30, trimmed.", "Power back, hold altitude, let it slow to 55; then power up to about 2,000 rpm to hold altitude. Lots of right rudder.", "Airspeed +10/−0: never below 55, and no horn."],
    setup: () => ({ ...initialState({ altFt: ENTRY_ALT, iasKt: 65, hdgDeg: 360, flaps: 30 }) }),
    params: [
      { key: "ias", label: "Airspeed", unit: "kt", target: 55, tol: 10, tolLow: 0, tolHigh: 10, graceSec: 25 },
      { key: "alt", label: "Altitude", unit: "ft", target: "entry", tol: 100 },
      { key: "hdg", label: "Heading", unit: "deg", target: "entry", tol: 10, wrap: true },
    ],
    durationSec: 120,
    isComplete: (ctx) => ctx.elapsed >= 120,
    extraFindings: (ctx) => {
      const hornSecs = ctx.samples.filter((s) => s.readout.horn).length / 10;
      const stalled = ctx.samples.some((s) => s.readout.stalled);
      const out: Finding[] = [];
      if (stalled) out.push({ severity: "fail", text: "The airplane stalled during slow flight." });
      else if (hornSecs > 1) out.push({ severity: "warn", text: `Stall horn sounded for ${hornSecs.toFixed(0)} s. The ACS wants you just above the warning.` });
      else out.push({ severity: "info", text: "No stall warning: nicely on the edge." });
      return out;
    },
    hud: (ctx) => `Flaps 30 · 55 kt (+10/−0) · 3,000 ft · 360° · ${Math.max(0, 120 - Math.floor(ctx.elapsed))} s left`,
  },
  {
    id: "power-off-stall",
    title: "Power-off stall and recovery",
    acsRef: "PA.VII.B",
    description: "From a landing-configuration descent, stall the airplane and recover with minimum altitude loss, holding heading.",
    briefing: ["Start at 3,000 ft, 65 knots, flaps 30 (approach).", "Throttle to idle, raise the nose steadily, hold heading with rudder until the break.", "Recover: nose down, FULL power, wings level, flaps to 20, then 10, climb at Vy."],
    setup: () => ({ ...initialState({ altFt: ENTRY_ALT, iasKt: 65, hdgDeg: 360, flaps: 30 }) }),
    params: [{ key: "hdg", label: "Heading", unit: "deg", target: "entry", tol: 10, wrap: true }],
    durationSec: 150,
    isComplete: (ctx) => {
      const i = ctx.samples.findIndex((s) => s.readout.stalled);
      if (i < 0) return false;
      ctx.memo.stallIndex = i;
      const r = ctx.latest;
      return ctx.samples.length - i > 30 && stable(ctx, 3, (rr, s) => !rr.stalled && rr.ias > 60 && vsNow(s) > -100 && Math.abs(rr.bank) < 10) && r.inputs.throttle > 0.9;
    },
    extraFindings: (ctx) => {
      const out: Finding[] = [];
      const i = ctx.samples.findIndex((s) => s.readout.stalled);
      if (i < 0) { out.push({ severity: "fail", text: "The airplane never stalled. Keep raising the nose until the break." }); return out; }
      const loss = altLoss(ctx, i);
      out.push({ severity: loss > 300 ? "warn" : "info", text: `Altitude lost in the recovery: ${loss.toFixed(0)} ft.` });
      const powerAt = ctx.samples.slice(i).findIndex((s) => s.inputs.throttle > 0.9);
      if (powerAt < 0) out.push({ severity: "fail", text: "Full power was never applied after the stall." });
      else if (powerAt > 30) out.push({ severity: "warn", text: `Full power came ${(powerAt / 10).toFixed(1)} s after the break. Make it immediate.` });
      let secondary = false, unstalled = false;
      for (let k = i; k < ctx.samples.length; k++) { const st = ctx.samples[k].readout.stalled; if (!st) unstalled = true; else if (unstalled) { secondary = true; break; } }
      if (secondary) out.push({ severity: "fail", text: "Secondary stall: you pulled too soon in the recovery." });
      const maxBank = Math.max(...ctx.samples.slice(i).map((s) => Math.abs(s.readout.bank)));
      if (maxBank > 20) out.push({ severity: "warn", text: `A wing dropped to ${maxBank.toFixed(0)}° during the stall. Rudder, not aileron.` });
      return out;
    },
    hud: (ctx) => ctx.samples.some((s) => s.readout.stalled) ? "STALL: nose down, full power, wings level, flaps 20" : "Throttle idle, raise the nose, hold 360° until the break",
  },
  {
    id: "unusual-attitude",
    title: "Unusual attitude: nose high",
    acsRef: "PA.VIII.E",
    description: "Instruments are covered for three seconds. Recover: power, push, roll.",
    briefing: ["Eyes closed until the instruments reappear.", "Airspeed decreasing and nose high: add power, lower the nose to the horizon, then level the wings.", "Return to straight-and-level and re-trim."],
    setup: () => {
      const init = initialState({ altFt: 3500, iasKt: 75, hdgDeg: 45, bankDeg: 30, pitchOffsetDeg: 14 });
      return { ...init, inputs: { ...init.inputs, throttle: 0.45 }, coverInstrumentsSec: 3 };
    },
    params: [],
    durationSec: 45,
    isComplete: (ctx) => ctx.elapsed > 5 && stable(ctx, 3, (r, s) => Math.abs(r.bank) < 5 && Math.abs(vsNow(s)) < 300 && r.ias > 65 && r.ias < 115),
    extraFindings: (ctx) => {
      const out: Finding[] = [];
      if (ctx.samples.some((s) => s.readout.stalled)) out.push({ severity: "fail", text: "Stalled during the recovery: lower the nose sooner." });
      const powerIdx = ctx.samples.findIndex((s) => s.inputs.throttle > 0.85);
      const levelIdx = ctx.samples.findIndex((s, i) => i > 30 && Math.abs(s.readout.bank) < 10);
      if (powerIdx < 0) out.push({ severity: "warn", text: "Power was never added: nose-high recovery is power, push, roll." });
      else if (levelIdx >= 0 && levelIdx < powerIdx) out.push({ severity: "warn", text: "You leveled the wings before adding power. Nose high: power first." });
      out.push({ severity: "info", text: `Recovered in ${ctx.elapsed.toFixed(1)} s.` });
      return out;
    },
    hud: (ctx) => (ctx.elapsed < 3 ? "Instruments covered..." : "Recover: power, push, roll"),
  },
  {
    id: "unusual-attitude-low",
    title: "Unusual attitude: nose low",
    acsRef: "PA.VIII.E",
    description: "Instruments are covered for three seconds. Recover: power off, level the wings, then ease the nose up.",
    briefing: ["Eyes closed until the instruments reappear.", "Airspeed increasing and nose low: throttle idle, level the wings, then raise the nose gently.", "Never pull while banked: that tightens the spiral."],
    setup: () => {
      const init = initialState({ altFt: 4000, iasKt: 110, hdgDeg: 200, bankDeg: -55, pitchOffsetDeg: -14 });
      return { ...init, inputs: { ...init.inputs, throttle: 0.9 }, coverInstrumentsSec: 3 };
    },
    params: [],
    durationSec: 45,
    isComplete: (ctx) => ctx.elapsed > 5 && stable(ctx, 3, (r, s) => Math.abs(r.bank) < 5 && Math.abs(vsNow(s)) < 300 && r.ias > 65 && r.ias < 125),
    extraFindings: (ctx) => {
      const out: Finding[] = [];
      const maxIas = Math.max(...ctx.samples.map((s) => s.readout.ias));
      const maxG = Math.max(...ctx.samples.map((s) => s.readout.g));
      if (maxIas > 163) out.push({ severity: "fail", text: `Exceeded Vne (${maxIas.toFixed(0)} kt).` });
      else if (maxIas > 129) out.push({ severity: "warn", text: `Into the yellow arc (${maxIas.toFixed(0)} kt). Get the power off sooner.` });
      if (maxG > 3.8) out.push({ severity: "fail", text: `Exceeded the limit load factor (${maxG.toFixed(1)} g).` });
      else if (maxG > 2.5) out.push({ severity: "warn", text: `Peak ${maxG.toFixed(1)} g in the pull-out.` });
      const pulledBanked = ctx.samples.some((s) => Math.abs(s.readout.bank) > 30 && s.inputs.elevator > 0.5 && s.readout.g > 1.6);
      if (pulledBanked) out.push({ severity: "warn", text: "You pulled while still banked. Nose low: power, roll, then pull." });
      if (ctx.samples.some((s) => s.readout.stalled)) out.push({ severity: "fail", text: "Stalled in the pull-out (accelerated stall)." });
      out.push({ severity: "info", text: `Recovered in ${ctx.elapsed.toFixed(1)} s.` });
      return out;
    },
    hud: (ctx) => (ctx.elapsed < 3 ? "Instruments covered..." : "Recover: power off, roll level, then pull"),
  },
  {
    id: "engine-failure",
    title: "Engine failure: establish best glide",
    acsRef: "PA.IX.B",
    description: "In cruise the engine quits. Pitch and trim for 68 knots best glide and hold it while you would pick a field.",
    briefing: ["Cruise at 4,000 ft, 100 knots. The engine fails a few seconds in.", "Pitch up immediately to hold 68 knots; trim it. The nose sits a little below the horizon.", "In the airplane: best field, restart flow, declare, secure."],
    setup: () => ({ ...initialState({ altFt: 4000, iasKt: 100, hdgDeg: 300 }) }),
    params: [
      { key: "ias", label: "Airspeed", unit: "kt", target: 68, tol: 10, graceSec: 20 },
      { key: "hdg", label: "Heading", unit: "deg", target: "entry", tol: 10, wrap: true },
    ],
    durationSec: 75,
    event: (ctx) => (ctx.elapsed >= 5 && !ctx.memo.failed ? ((ctx.memo.failed = true), { engineOut: true }) : null),
    isComplete: (ctx) => ctx.elapsed >= 75,
    extraFindings: (ctx) => {
      const out: Finding[] = [];
      const after = ctx.samples.filter((s) => s.readout.engineOut);
      const idx = after.findIndex((s) => Math.abs(s.readout.ias - 68) <= 5);
      if (idx < 0) out.push({ severity: "fail", text: "Never reached best glide (68 ±5 kt)." });
      else out.push({ severity: idx > 200 ? "warn" : "info", text: `Best glide established ${(idx / 10).toFixed(0)} s after the failure.` });
      const minIas = Math.min(...after.map((s) => s.readout.ias));
      if (minIas < 55) out.push({ severity: "warn", text: `Airspeed decayed to ${minIas.toFixed(0)} kt: pitch down first, then trim.` });
      if (after.some((s) => s.readout.stalled)) out.push({ severity: "fail", text: "Stalled after the engine failure." });
      return out;
    },
    hud: (ctx) => (ctx.latest.readout.engineOut ? "ENGINE OUT: pitch for 68 kt, trim, hold heading" : "Cruise... stand by"),
  },
];

export const taskById = (id: string) => TASKS.find((t) => t.id === id);
