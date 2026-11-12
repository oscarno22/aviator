/**
 * Step-by-step procedures the flight sim grades: what to do, and the window to do it in.
 * Every number the sim checks lives here so an instructor can review it in one place.
 * Speeds and flap settings come from maneuvers.ts (traffic pattern, normal landing,
 * go-around, normal takeoff) and c172.ts. The 172S is fuel injected: no carb heat.
 * Values marked "chosen" are not in those files.
 */
import { C172 } from "./c172";

/** Moments the sim detects during a pattern. Step windows open and close on them. */
export type GateId =
  | "start" | "abeam" | "baseTurn" | "finalEstablished" | "agl300" | "threshold"
  | "goAround" | "positiveRate" | "liftoff" | "touchdown";

export type Check =
  | { kind: "flaps"; eq: 0 | 10 | 20 | 30 }        // flap lever position
  | { kind: "rpm"; min: number; max: number }      // tachometer
  | { kind: "throttle"; min: number }              // throttle lever, 0..1
  | { kind: "ias"; min: number; max: number };     // indicated airspeed, kt

export interface SeqStep {
  id: string;
  label: string;
  /** The window opens at this gate. */
  from: GateId;
  /** The window closes at this gate, or this many seconds after it opened. */
  to: GateId | { sec: number };
  check: Check;
  /** A critical step that is missed or done early fails the task. */
  critical?: boolean;
  /** Shown as the prompt when Coach is on. */
  hint?: string;
}

export interface SequenceSpec {
  /** Pin a runway id from airports.ts. Otherwise the training airport's runway from Settings is used. */
  runwayId?: string;
  steps: SeqStep[];
  limits: { vfe10: number; vfe30: number };
  /** Go-around drill only: the "Go around" call comes at this height above the runway. */
  goAroundCallAglFt?: number;
}

const V = C172.vSpeeds;

export const FLAP_LIMITS = { vfe10: V.Vfe10.kt, vfe30: V.Vfe30.kt } as const;

/** Pattern geometry and the approach aids drawn on the pattern map. */
export const PATTERN = {
  downwindOffsetNm: 1,          // maneuvers.ts says "half to 1 mile"; 1 chosen so final is long enough to settle
  downwindIasKt: 90,            // maneuvers.ts, traffic pattern
  stabilisedAglFt: 300,         // maneuvers.ts, "stabilized by 300 ft AGL"
  glidepathDeg: 3,              // chosen: standard visual glidepath
  aimPointFt: 1000,             // chosen: aim point 1,000 ft past the threshold
  papiDeg: [2.5, 2.83, 3.17, 3.5] as readonly number[], // chosen: standard four-light PAPI angles
  centrelineBarM: 150,          // chosen: full scale of the centreline bar, each side
  touchdownZoneFt: 3000,        // chosen: first 3,000 ft or first third of the runway, whichever is shorter
} as const;

/** Targets and bands in knots. Final and Vy use the ACS +10/-5; the others use plus or minus 5 (chosen). */
export const SPEEDS = {
  abeam: { target: 80, min: 75, max: 85 },
  base: { target: 70, min: 65, max: 75 },
  final: { target: V.normalApproach.kt, min: V.normalApproach.kt - 5, max: V.normalApproach.kt + 10 },
  vy: { target: V.Vy.kt, min: V.Vy.kt - 5, max: V.Vy.kt + 10 },
  rotate: { target: V.Vr.kt, min: V.Vr.kt - 5, max: V.Vr.kt + 10 },
  flapsUpMin: 60,               // maneuvers.ts: "flaps up above 60 knots"
} as const;

/** Timing rules shared by all steps (chosen). */
export const TIMING = {
  leadSec: 2,          // a control moved up to this long before its window opens still counts as on time
  legHoldSec: 2,       // a new pattern leg must hold this long before it counts
  positiveRateFpm: 200,
  positiveRateHoldSec: 2,
  goAroundThrottle: 0.9,
} as const;

/** Seconds after "positive rate" before the climb airspeed band is graded: time to accelerate to Vy (chosen, fits the sim). */
export const CLIMB_SETTLE_SEC = 20;

/** "About 1500 rpm" abeam the numbers. The band is chosen. */
const ABEAM_RPM = { min: 1400, max: 1700 };

const PATTERN_STEPS: SeqStep[] = [
  { id: "abeam-power", label: "Power back to about 1500 rpm", from: "abeam", to: { sec: 10 }, check: { kind: "rpm", ...ABEAM_RPM }, hint: "Abeam the numbers: power back to 1500 rpm" },
  { id: "flaps-10", label: "Flaps 10", from: "abeam", to: { sec: 10 }, check: { kind: "flaps", eq: 10 }, critical: true, hint: "Flaps 10" },
  { id: "ias-80", label: "Slow to 80 knots", from: "abeam", to: "baseTurn", check: { kind: "ias", min: SPEEDS.abeam.min, max: SPEEDS.abeam.max }, hint: "Pitch for 80 knots and trim" },
  { id: "flaps-20", label: "Flaps 20 on base", from: "baseTurn", to: "finalEstablished", check: { kind: "flaps", eq: 20 }, critical: true, hint: "Base: flaps 20" },
  { id: "ias-70", label: "Slow to 70 knots", from: "baseTurn", to: "finalEstablished", check: { kind: "ias", min: SPEEDS.base.min, max: SPEEDS.base.max }, hint: "Pitch for 70 knots" },
  { id: "flaps-30", label: "Flaps 30 on final", from: "finalEstablished", to: "agl300", check: { kind: "flaps", eq: 30 }, critical: true, hint: "Final: flaps 30, 65 knots" },
];

const TAKEOFF_STEPS: SeqStep[] = [
  { id: "takeoff-power", label: "Full power", from: "start", to: { sec: 5 }, check: { kind: "throttle", min: 0.95 }, critical: true, hint: "Full throttle, right rudder" },
  { id: "climb-vy", label: "Climb at 74 knots", from: "liftoff", to: { sec: 30 }, check: { kind: "ias", min: SPEEDS.vy.min, max: SPEEDS.vy.max }, hint: "Pitch for 74 knots" },
  { id: "flaps-up", label: "Flaps up", from: "positiveRate", to: { sec: 30 }, check: { kind: "flaps", eq: 0 }, critical: true, hint: "Positive rate: flaps up, trim" },
];

export const PATTERN_SEQUENCE: SequenceSpec = { steps: PATTERN_STEPS, limits: FLAP_LIMITS };

export const GO_AROUND_SEQUENCE: SequenceSpec = {
  limits: FLAP_LIMITS,
  goAroundCallAglFt: 100,       // chosen
  steps: [
    { id: "ga-power", label: "Full power", from: "goAround", to: { sec: 3 }, check: { kind: "throttle", min: 0.95 }, critical: true, hint: "Full throttle now" },
    { id: "ga-flaps-20", label: "Flaps 20 at once", from: "goAround", to: { sec: 5 }, check: { kind: "flaps", eq: 20 }, critical: true, hint: "Flaps 20" },
    { id: "ga-flaps-10", label: "Flaps 10 after positive rate", from: "positiveRate", to: { sec: 10 }, check: { kind: "flaps", eq: 10 }, critical: true, hint: "Positive rate: flaps 10" },
    { id: "ga-vy", label: "Climb at 74 knots", from: "positiveRate", to: { sec: 30 }, check: { kind: "ias", min: SPEEDS.vy.min, max: SPEEDS.vy.max }, hint: "Pitch for 74 knots" },
    { id: "ga-flaps-up", label: "Flaps up", from: "positiveRate", to: { sec: 30 }, check: { kind: "flaps", eq: 0 }, critical: true, hint: "Above 60 knots and climbing: flaps up, trim" },
  ],
};

/** Go-around drill start: this far out on final, on the glidepath (chosen). */
export const GO_AROUND_START_FINAL_NM = 0.5;

export const TAKEOFF_SEQUENCE: SequenceSpec = { steps: TAKEOFF_STEPS, limits: FLAP_LIMITS };
/** Takeoff drill: flaps for takeoff (maneuvers.ts allows 0 to 10) and the height at which the drill ends (chosen). */
export const TAKEOFF = { flaps: 10 as const, endAglFt: 500, centrelineWarnM: 5 } as const;

export const CLOSED_PATTERN_SEQUENCE: SequenceSpec = { steps: [...TAKEOFF_STEPS, ...PATTERN_STEPS], limits: FLAP_LIMITS };

/** Coarse landing findings (chosen). Flare quality, bounce and crosswind technique are not graded. */
export const LANDING = { gentleSinkFpm: 300 } as const; // the crash limit (600 fpm) is GROUND.maxTouchdownSinkMs in sim/engine.ts
