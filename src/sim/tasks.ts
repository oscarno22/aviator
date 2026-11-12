/**
 * Practice tasks graded against Private Pilot ACS tolerances.
 * Units in TaskParam are aviation units from InstrumentReadout.
 */
import { initialState } from "./engine";
import type { ControlInputs, InstrumentReadout, SimSnapshot, SimState } from "./types";
import { M_TO_FT, MS_TO_FPM, NM_TO_M, RAD_TO_DEG, angleDiff, wrap360 } from "@/lib/units";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import {
  CLIMB_SETTLE_SEC, CLOSED_PATTERN_SEQUENCE, GO_AROUND_SEQUENCE, GO_AROUND_START_FINAL_NM, LANDING, PATTERN, PATTERN_SEQUENCE,
  SPEEDS, TAKEOFF, TAKEOFF_SEQUENCE, type GateId, type SequenceSpec,
} from "@/data/procedures";
import { glidepathHeightM, type Gates, type Leg } from "./pattern";
import { fromFrame, runwayFrom, toFrame, type RunwayFrame } from "./world";

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
  /** Only grade the samples between two gates (to the end of the run when `to` is left out). graceSec then counts from `from`. */
  segment?: { from: GateId; to?: GateId };
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
  // ---- sequence tasks only
  runway?: RunwayFrame;
  /** Sample index at which each gate was passed. */
  gates?: Gates;
  leg?: Leg | null;
  /** Set when the pattern could not be followed; the run ends ungraded. */
  lost?: string;
  /** Ground track in runway coordinates [along, cross], metres, 2 Hz. */
  track?: [number, number][];
  coached?: boolean;
}

export interface PracticeTask {
  id: string;
  title: string;
  acsRef: string;
  description: string;
  briefing: string[];
  /** Sequence tasks are placed relative to the runway; airwork tasks ignore it. */
  setup(runway?: RunwayFrame): TaskSetup;
  /** Graded procedure steps. Tasks with a sequence fly over a runway with ground and a pattern map. */
  sequence?: SequenceSpec;
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

// ---------------------------------------------------------------- runway tasks

/** The runway used when the app does not pass one (tests, server render). */
export const defaultRunway = (): RunwayFrame => runwayFrom(DEFAULT_SETTINGS.trainingAirport, undefined, DEFAULT_SETTINGS.runwayHeading);

const rwyDeg = (f: RunwayFrame) => wrap360(f.hdgRad * RAD_TO_DEG);
const sinceGate = (ctx: TaskContext, g: GateId) => (ctx.gates?.[g] == null ? -1 : (ctx.samples.length - 1 - ctx.gates[g]!) / 10);
const sideWord = (f: RunwayFrame, cross: number) => ((f.patternSide === "left" ? -cross : cross) >= 0 ? "right" : "left");

function downwindStart(f: RunwayFrame): TaskSetup {
  const p = fromFrame(f, f.lengthM / 2, PATTERN.downwindOffsetNm * NM_TO_M);
  return initialState({ altFt: f.patternAltM * M_TO_FT, iasKt: PATTERN.downwindIasKt, hdgDeg: wrap360(rwyDeg(f) + 180), xM: p.x, yM: p.y });
}

function finalStart(f: RunwayFrame): TaskSetup {
  const along = -GO_AROUND_START_FINAL_NM * NM_TO_M;
  const p = fromFrame(f, along, 0);
  return initialState({
    altFt: (f.elevM + glidepathHeightM(along)) * M_TO_FT, iasKt: SPEEDS.final.target, hdgDeg: rwyDeg(f), flaps: 30,
    pathDeg: -PATTERN.glidepathDeg, xM: p.x, yM: p.y,
  });
}

function runwayStart(f: RunwayFrame): TaskSetup {
  const p = fromFrame(f, 15, 0);
  return initialState({ altFt: f.elevM * M_TO_FT, iasKt: SPEEDS.vy.target, hdgDeg: rwyDeg(f), flaps: TAKEOFF.flaps, onGround: true, xM: p.x, yM: p.y });
}

function thresholdFindings(ctx: TaskContext): Finding[] {
  const i = ctx.gates?.threshold, f = ctx.runway;
  if (i == null || !f) return [];
  const s = ctx.samples[i];
  const { cross } = toFrame(f, s.state.x, s.state.y);
  const off = Math.abs(cross);
  const out: Finding[] = [];
  out.push(off > f.widthM / 2
    ? { severity: "fail", text: `Crossed the threshold ${off.toFixed(0)} m ${sideWord(f, cross)} of the centreline: not over the runway.` }
    : { severity: "info", text: `Crossed the threshold ${off.toFixed(0)} m from the centreline at ${s.readout.agl.toFixed(0)} ft.` });
  const ias = s.readout.ias;
  out.push(ias >= SPEEDS.final.min && ias <= SPEEDS.final.max
    ? { severity: "info", text: `Speed over the threshold: ${ias.toFixed(0)} kt.` }
    : { severity: "warn", text: `Speed over the threshold: ${ias.toFixed(0)} kt. Aim for ${SPEEDS.final.target} (${SPEEDS.final.min} to ${SPEEDS.final.max}).` });
  return out;
}

function wentAround(ctx: TaskContext): Finding[] {
  return ctx.gates?.goAround != null
    ? [{ severity: "fail", text: "You went around. That is always a good call in the airplane, but this run does not count as a finished approach." }]
    : [];
}

/** Coarse only: where it touched down and how hard. Flare, bounce and crosswind technique are not graded. */
function landingFindings(ctx: TaskContext): Finding[] {
  const i = ctx.gates?.touchdown, f = ctx.runway;
  if (i == null || !f) return [];
  const s = ctx.samples[i];
  const { along } = toFrame(f, s.state.x, s.state.y);
  const zoneFt = Math.min(PATTERN.touchdownZoneFt, (f.lengthM * M_TO_FT) / 3);
  const alongFt = along * M_TO_FT;
  const sink = s.state.tdSink * MS_TO_FPM;
  return [
    { severity: "info", text: "Landed on the runway." },
    alongFt <= zoneFt
      ? { severity: "info", text: `Touched down ${alongFt.toFixed(0)} ft past the threshold, in the touchdown zone.` }
      : { severity: "warn", text: `Touched down ${alongFt.toFixed(0)} ft past the threshold, beyond the touchdown zone (first ${zoneFt.toFixed(0)} ft).` },
    sink <= LANDING.gentleSinkFpm
      ? { severity: "info", text: `Sink rate at touchdown: ${sink.toFixed(0)} fpm.` }
      : { severity: "warn", text: `Firm touchdown: ${sink.toFixed(0)} fpm. Keep raising the nose as it sinks.` },
  ];
}

function takeoffFindings(ctx: TaskContext): Finding[] {
  const i = ctx.gates?.liftoff, f = ctx.runway;
  if (!f) return [];
  if (i == null) return [{ severity: "fail", text: "Never left the ground." }];
  const ias = ctx.samples[i].readout.ias;
  const out: Finding[] = [ias >= SPEEDS.rotate.min && ias <= SPEEDS.rotate.max
    ? { severity: "info", text: `Lifted off at ${ias.toFixed(0)} kt.` }
    : { severity: "warn", text: `Lifted off at ${ias.toFixed(0)} kt. Rotate at ${SPEEDS.rotate.target}.` }];
  let maxOff = 0;
  for (let k = 0; k < i; k++) maxOff = Math.max(maxOff, Math.abs(toFrame(f, ctx.samples[k].state.x, ctx.samples[k].state.y).cross));
  out.push(maxOff <= TAKEOFF.centrelineWarnM
    ? { severity: "info", text: `Stayed within ${Math.max(1, Math.ceil(maxOff))} m of the centreline on the roll.` }
    : { severity: "warn", text: `Drifted ${maxOff.toFixed(0)} m off the centreline on the roll. More right rudder as the power comes in.` });
  return out;
}

const downwindParams: TaskParam[] = [
  { key: "alt", label: "Downwind altitude", unit: "ft", target: "entry", tol: 100, segment: { from: "start", to: "abeam" } },
  { key: "ias", label: "Downwind airspeed", unit: "kt", target: PATTERN.downwindIasKt, tol: 10, segment: { from: "start", to: "abeam" } },
];
const finalParam: TaskParam = {
  key: "ias", label: "Final airspeed", unit: "kt", target: SPEEDS.final.target, tol: 10, tolLow: 5, tolHigh: 10,
  segment: { from: "agl300", to: "threshold" },
};
const climbParam: TaskParam = {
  key: "ias", label: "Climb airspeed", unit: "kt", target: SPEEDS.vy.target, tol: 10, tolLow: 5, tolHigh: 10,
  graceSec: CLIMB_SETTLE_SEC, minPct: 0.8, segment: { from: "positiveRate" },
};

function patternHud(ctx: TaskContext): string {
  const f = ctx.runway;
  if (!f) return "";
  const { along } = toFrame(f, ctx.latest.state.x, ctx.latest.state.y);
  switch (ctx.leg) {
    case "upwind": return ctx.latest.readout.onGround ? "Full power, hold the centreline, rotate at 55" : "Upwind: climb at 74 kt, then turn crosswind";
    case "crosswind": return "Crosswind: level at pattern altitude, turn downwind 1 mile out";
    case "downwind": return along > 0 ? `Downwind: hold altitude and 90 kt · abeam the numbers in ${(along / NM_TO_M).toFixed(1)} nm` : "Past abeam: descend, turn base when the numbers are 45 degrees behind the wing";
    case "base": return "Base: keep descending, turn final to line up with the runway";
    case "final": return ctx.latest.readout.onGround ? "On the runway: throttle idle, hold the centreline" : "Final: 65 kt, two red and two white, stay on the centreline";
    default: return "Fly the pattern";
  }
}

TASKS.push(
  {
    id: "pattern-downwind",
    title: "Pattern: downwind to threshold",
    acsRef: "PA.III.B / PA.IV.B",
    description: "Start midfield on downwind and fly the configuration steps in order down to the runway threshold. The run ends at the threshold.",
    briefing: [
      "Midfield downwind at pattern altitude, 90 knots, 1 mile from the runway. Use the pattern map: there is no outside view.",
      "Abeam the numbers: power to about 1500 rpm, flaps 10, 80 knots. Base: flaps 20, 70 knots. Final: flaps 30, 65 knots.",
      "Be set up and on speed by 300 ft above the runway. Flaps 10 only below 110 knots, more flap only below 85.",
    ],
    setup: (f = defaultRunway()) => downwindStart(f),
    sequence: PATTERN_SEQUENCE,
    params: [...downwindParams, finalParam],
    durationSec: 420,
    isComplete: (ctx) => ctx.gates?.threshold != null || sinceGate(ctx, "goAround") >= 5,
    extraFindings: (ctx) => {
      const out = [...thresholdFindings(ctx), ...wentAround(ctx)];
      if (ctx.gates?.threshold == null && ctx.gates?.goAround == null && !ctx.lost && !ctx.latest.readout.crashed) out.push({ severity: "fail", text: "Did not reach the runway threshold." });
      return out;
    },
    hud: patternHud,
  },
  {
    id: "go-around",
    title: "Go-around from short final",
    acsRef: "PA.IV.N",
    description: "Fly the approach from a half-mile final. When the call comes, go around: power, flaps 20, positive rate, flaps 10, 74 knots, flaps up.",
    briefing: [
      "Half a mile out on final, 65 knots, flaps 30, descending on the glidepath.",
      "On the call: full throttle and flaps 20 at once. Push against the trim so the nose does not balloon.",
      "When the VSI shows a climb: flaps 10. Then 74 knots, and flaps up above 60 knots.",
    ],
    setup: (f = defaultRunway()) => finalStart(f),
    sequence: GO_AROUND_SEQUENCE,
    params: [
      { key: "hdg", label: "Heading", unit: "deg", target: "entry", tol: 10, wrap: true },
      climbParam,
    ],
    durationSec: 150,
    isComplete: (ctx) => {
      const since = sinceGate(ctx, "goAround");
      if (since < 0) return false;
      return since >= 60 || (ctx.gates?.positiveRate != null && stable(ctx, 5, (r, s) => s.inputs.flaps === 0 && r.ias >= SPEEDS.vy.min && r.vs > 0));
    },
    extraFindings: (ctx) => {
      const g = ctx.gates?.goAround;
      if (g == null) return ctx.lost ? [] : [{ severity: "fail", text: "The go-around call never came. Stay on the approach until it does." }];
      const after = ctx.samples.slice(g);
      const out: Finding[] = [{ severity: "info", text: `Lowest point after the call: ${Math.max(0, Math.min(...after.map((s) => s.readout.agl))).toFixed(0)} ft above the runway.` }];
      const up = after.find((s) => s.inputs.flaps === 0);
      if (up && up.readout.ias < SPEEDS.flapsUpMin) out.push({ severity: "warn", text: `Flaps came up at ${up.readout.ias.toFixed(0)} kt. Wait for ${SPEEDS.flapsUpMin} or more.` });
      return out;
    },
    hud: (ctx) => (ctx.gates?.goAround != null ? "GO AROUND" : "Continue the approach: 65 kt, flaps 30. Be ready for the call."),
  },
  {
    id: "normal-takeoff",
    title: "Normal takeoff",
    acsRef: "PA.IV.A",
    description: "Full power, hold the centreline with rudder, rotate at 55, climb at 74 knots and bring the flaps up. The run ends 500 ft above the runway.",
    briefing: [
      "Lined up on the centreline, flaps 10, engine idling.",
      "Smoothly to full throttle. The airplane pulls left: hold the centreline with right rudder.",
      "At 55 knots ease back to rotate. Pitch for 74. With a climb showing, flaps up and trim.",
    ],
    setup: (f = defaultRunway()) => runwayStart(f),
    sequence: TAKEOFF_SEQUENCE,
    params: [
      { key: "hdg", label: "Runway heading", unit: "deg", target: "entry", tol: 10, wrap: true },
      climbParam,
    ],
    durationSec: 180,
    isComplete: (ctx) => ctx.gates?.liftoff != null && ctx.latest.readout.agl >= TAKEOFF.endAglFt,
    extraFindings: (ctx) => {
      const out = takeoffFindings(ctx);
      if (ctx.gates?.liftoff != null && ctx.latest.readout.agl < TAKEOFF.endAglFt && !ctx.latest.readout.crashed && !ctx.lost) out.push({ severity: "fail", text: `Did not climb to ${TAKEOFF.endAglFt} ft above the runway.` });
      return out;
    },
    hud: (ctx) => (ctx.latest.readout.onGround ? "Full power, right rudder, rotate at 55" : `Climb at 74 kt on runway heading · ${Math.max(0, TAKEOFF.endAglFt - ctx.latest.readout.agl).toFixed(0)} ft to go`),
  },
  {
    id: "closed-pattern",
    title: "Full closed pattern",
    acsRef: "PA.III.B / PA.IV.A / PA.IV.B",
    description: "Take off, fly the whole pattern and land. Steps are graded all the way round; the landing itself is only checked coarsely.",
    briefing: [
      "Take off as in the takeoff drill. Climb at 74 knots, flaps up, turn crosswind within 300 ft of pattern altitude.",
      "Level at pattern altitude, turn downwind 1 mile from the runway at 90 knots. Then the same steps as the downwind drill.",
      "Over the threshold: throttle to idle and hold it off. The brakes come on by themselves at idle. Flare quality is not graded.",
    ],
    setup: (f = defaultRunway()) => runwayStart(f),
    sequence: CLOSED_PATTERN_SEQUENCE,
    params: [finalParam],
    durationSec: 900,
    isComplete: (ctx) => sinceGate(ctx, "touchdown") >= 5 || sinceGate(ctx, "goAround") >= 5,
    extraFindings: (ctx) => {
      const out = [...takeoffFindings(ctx)];
      const f = ctx.runway, ab = ctx.gates?.abeam;
      if (f && ab != null) {
        const dev = ctx.samples[ab].readout.alt - f.patternAltM * M_TO_FT;
        out.push({ severity: Math.abs(dev) <= 100 ? "info" : "warn", text: `Abeam the numbers ${Math.abs(dev).toFixed(0)} ft ${dev >= 0 ? "above" : "below"} pattern altitude.` });
      }
      out.push(...thresholdFindings(ctx), ...landingFindings(ctx), ...wentAround(ctx));
      if (ctx.gates?.touchdown == null && ctx.gates?.goAround == null && !ctx.lost && !ctx.latest.readout.crashed) out.push({ severity: "fail", text: "Did not land." });
      return out;
    },
    hud: patternHud,
  },
);


export const taskById = (id: string) => TASKS.find((t) => t.id === id);
