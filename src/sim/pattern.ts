/**
 * Traffic-pattern tracking: which leg the airplane is on and when it passed each gate.
 * Pure bookkeeping over 10 Hz samples; no DOM, no storage.
 */
import { FT_TO_M, NM_TO_M, DEG_TO_RAD } from "@/lib/units";
import { PATTERN, TIMING, type GateId, type SequenceSpec } from "@/data/procedures";
import { relHeadingDeg, toFrame, type RunwayFrame } from "./world";

export type Leg = "upwind" | "crosswind" | "downwind" | "base" | "final";
export const LEG_ORDER: Leg[] = ["upwind", "crosswind", "downwind", "base", "final"];
export const LEG_LABEL: Record<Leg, string> = { upwind: "Upwind", crosswind: "Crosswind", downwind: "Downwind", base: "Base", final: "Final" };

export type Gates = Partial<Record<GateId, number>>;

export interface PatternSample {
  x: number; y: number;   // m, world
  hdgRad: number;
  aglFt: number;
  vsFpm: number;
  throttle: number;
  onGround: boolean;
}

export interface PatternOptions {
  sampleHz?: number;
  /** Go-around drill: the gate fires at this call height (or the matching point on the glidepath) instead of on throttle. */
  goAroundCallAglFt?: number;
}

/** How close to the centreline counts as "on final", m (chosen). */
export const FINAL_CAPTURE_M = 250;
const FINAL_HDG_DEG = 30;
const TURN_START_DEG = 10;
const LOST_AFTER_SEC = 30;
const LOST_RANGE_M = 3 * NM_TO_M;

/** Distance past the threshold of the aim point, m. */
export const aimPointM = () => PATTERN.aimPointFt * FT_TO_M;
/** Height of the nominal glidepath above the runway at a point this far past the threshold (negative before it), m. */
export const glidepathHeightM = (along: number) => Math.max(0, aimPointM() - along) * Math.tan(PATTERN.glidepathDeg * DEG_TO_RAD);
/** Angle up from the aim point to the airplane, degrees. */
export function glidepathAngleDeg(along: number, aglFt: number): number {
  const dist = aimPointM() - along;
  if (dist <= 1) return 90;
  return Math.atan2(aglFt * FT_TO_M, dist) / DEG_TO_RAD;
}

/** The leg a single position and heading looks like, ignoring history. Null when it fits none. */
export function classifyLeg(f: RunwayFrame, p: PatternSample): Leg | null {
  const rel = relHeadingDeg(f, p.hdgRad);
  const { along, cross } = toFrame(f, p.x, p.y);
  if (Math.abs(rel) <= 45) {
    if (along >= 0) return "upwind";
    return Math.abs(rel) <= FINAL_HDG_DEG && Math.abs(cross) <= FINAL_CAPTURE_M ? "final" : null;
  }
  if (Math.abs(rel) >= 135) return cross > 0 ? "downwind" : null;
  return rel > 0 ? "crosswind" : "base";
}

export class PatternTracker {
  leg: Leg | null = null;
  readonly gates: Gates = {};
  /** Set when the flight no longer looks like a pattern. Grading stops. */
  lost: string | null = null;

  private n = 0;
  private hold: number;
  private streak = 0;          // consecutive samples that look like the next leg
  private offCount = 0;        // consecutive samples that fit neither this leg nor the next
  private vsCount = 0;
  private prevAlong = 0;
  private prevOnGround = false;
  private rel: number[] = [];
  private hz: number;
  private callAlong: number | null = null;

  constructor(readonly frame: RunwayFrame, private opts: PatternOptions = {}) {
    this.hz = opts.sampleHz ?? 10;
    this.hold = Math.round(TIMING.legHoldSec * this.hz);
    if (opts.goAroundCallAglFt != null) {
      this.callAlong = aimPointM() - (opts.goAroundCallAglFt * FT_TO_M) / Math.tan(PATTERN.glidepathDeg * DEG_TO_RAD);
    }
  }

  static forSpec(frame: RunwayFrame, spec: SequenceSpec, sampleHz = 10): PatternTracker {
    return new PatternTracker(frame, { sampleHz, goAroundCallAglFt: spec.goAroundCallAglFt });
  }

  /** Feed the next sample. Samples are numbered from 0 in the order given. */
  update(p: PatternSample): void {
    const i = this.n++;
    const f = this.frame;
    const { along, cross } = toFrame(f, p.x, p.y);
    const rel = relHeadingDeg(f, p.hdgRad);
    this.rel.push(rel);
    const cls = classifyLeg(f, p);

    if (i === 0) {
      this.gates.start = 0;
      this.leg = cls;
      if (!cls) this.lost = "The starting position is not on a pattern leg.";
      this.prevAlong = along;
      this.prevOnGround = p.onGround;
      if (this.leg) this.pointGates(i, p, along);
      return;
    }
    if (this.lost || !this.leg) return;

    // ---- leg changes: forward only, and only after the new leg has held
    const next = LEG_ORDER[(LEG_ORDER.indexOf(this.leg) + 1) % LEG_ORDER.length];
    // Final only becomes upwind again after a go-around; a landing stays on final.
    const nextOk = cls === next && !(next === "upwind" && (p.onGround || this.gates.goAround == null));
    const onLeg = cls === this.leg || (this.leg === "final" && cls === "upwind");
    this.streak = nextOk ? this.streak + 1 : 0;
    if (this.streak >= this.hold) {
      const began = i - this.streak + 1;
      this.leg = next;
      this.streak = 0;
      if (next === "base" && this.gates.baseTurn == null) this.gates.baseTurn = this.turnStart(began);
      if (next === "final" && this.gates.finalEstablished == null) this.gates.finalEstablished = began;
    }

    // ---- lost: off-sequence for too long, or far from the airport
    this.offCount = onLeg || nextOk || p.onGround ? 0 : this.offCount + 1;
    if (this.offCount >= LOST_AFTER_SEC * this.hz) this.lost = `Off the ${LEG_LABEL[this.leg].toLowerCase()} leg for ${LOST_AFTER_SEC} seconds.`;
    if (Math.abs(cross) > LOST_RANGE_M || along < -LOST_RANGE_M || along > f.lengthM + LOST_RANGE_M) this.lost = "More than 3 miles from the runway.";

    this.pointGates(i, p, along);
    this.prevAlong = along;
    this.prevOnGround = p.onGround;
  }

  private pointGates(i: number, p: PatternSample, along: number) {
    const g = this.gates;
    if (i > 0) {
      if (g.abeam == null && this.leg === "downwind" && this.prevAlong > 0 && along <= 0) g.abeam = i;
      if (g.threshold == null && this.leg === "final" && this.prevAlong < 0 && along >= 0) g.threshold = i;
      if (g.liftoff == null && this.prevOnGround && !p.onGround) g.liftoff = i;
      if (g.touchdown == null && this.leg === "final" && !this.prevOnGround && p.onGround) g.touchdown = i;
    }
    if (g.agl300 == null && (this.leg === "base" || this.leg === "final") && p.aglFt <= PATTERN.stabilisedAglFt) g.agl300 = i;
    if (g.goAround == null && this.leg === "final" && !p.onGround && g.touchdown == null) {
      const called = this.opts.goAroundCallAglFt != null
        ? p.aglFt <= this.opts.goAroundCallAglFt || (this.callAlong != null && along >= this.callAlong)
        : p.throttle > TIMING.goAroundThrottle;
      if (called) g.goAround = i;
    }
    if (g.positiveRate == null && (g.goAround != null || g.liftoff != null) && !p.onGround) {
      this.vsCount = p.vsFpm > TIMING.positiveRateFpm ? this.vsCount + 1 : 0;
      if (this.vsCount >= Math.round(TIMING.positiveRateHoldSec * this.hz)) g.positiveRate = i;
    }
  }

  /** Walk back from where base was first recognised to where the heading left downwind. */
  private turnStart(began: number): number {
    let k = began;
    while (k > 0 && 180 - Math.abs(this.rel[k - 1]) > TURN_START_DEG) k--;
    return Math.max(this.gates.abeam ?? 0, k);
  }
}

/** Run a whole recording through a tracker. */
export function trackPattern(frame: RunwayFrame, samples: PatternSample[], opts: PatternOptions = {}): PatternTracker {
  const t = new PatternTracker(frame, opts);
  for (const s of samples) t.update(s);
  return t;
}
