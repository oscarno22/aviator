import type { OutputSink } from "./io/types";
import type { InstrumentReadout, SimSnapshot } from "./types";
import type { Finding, ParamKey, PracticeTask, TaskContext, TaskParam } from "./tasks";
import { angleDiff } from "@/lib/units";
import { TIMING, type Check, type SeqStep, type SequenceSpec } from "@/data/procedures";
import { PatternTracker } from "./pattern";
import { toFrame, type RunwayFrame } from "./world";

export interface ParamResult {
  key: ParamKey; label: string; unit: string; target: number; tol: number;
  pctInTol: number; maxDev: number; maxDevAtSec: number; pass: boolean; series: number[];
}

export type StepStatus = "onTime" | "early" | "late" | "missed";
export interface StepResult {
  id: string; label: string; status: StepStatus; critical: boolean;
  atSec?: number;       // when the step was done
  fromSec?: number;     // when its window opened
  toSec?: number;       // when its window closed
}
/** A step while the task is still running. */
export interface StepProgress extends Omit<StepResult, "status"> {
  status: StepStatus | "pending" | "active" | "overdue";
  hint?: string;
}

export interface TaskResult {
  id: string; taskId: string; title: string; startedAt: string; durationSec: number; pass: boolean;
  params: ParamResult[]; findings: Finding[]; maxG: number; minIas: number;
  /** Procedure steps, for tasks that have a sequence. */
  sequence?: StepResult[];
  /** Ground track in runway coordinates [along, cross], metres, at most about 300 points. */
  track?: [number, number][];
  /** True when Coach prompts were on at any time during the run. */
  coached?: boolean;
  /** True when the run could not be graded (pattern not recognised). Not stored, not scheduled. */
  ungraded?: boolean;
}

export const SAMPLE_HZ = 10;
const MAX_SERIES = 600;
const MAX_TRACK = 300;
const TRACK_EVERY = 5; // samples between track points (2 Hz)

function paramValue(r: InstrumentReadout, key: ParamKey): number {
  return r[key];
}

function targetOf(p: TaskParam, entry: InstrumentReadout): number {
  return p.target === "entry" ? paramValue(entry, p.key) : p.target;
}

/** Signed deviation from target, with heading wrap. */
function deviation(p: TaskParam, value: number, target: number): number {
  return p.wrap ? angleDiff(value, target) : value - target;
}

export function decimate<T>(series: T[], max = MAX_SERIES): T[] {
  if (series.length <= max) return series;
  const stride = series.length / max;
  const out: T[] = [];
  for (let i = 0; i < max; i++) out.push(series[Math.floor(i * stride)]);
  return out;
}

// ---------------------------------------------------------------- sequences

function checkOk(c: Check, s: SimSnapshot): boolean {
  switch (c.kind) {
    case "flaps": return s.inputs.flaps === c.eq;   // the lever, because the flaps themselves travel slowly
    case "rpm": return s.readout.rpm >= c.min && s.readout.rpm <= c.max;
    case "throttle": return s.inputs.throttle >= c.min;
    case "ias": return s.readout.ias >= c.min && s.readout.ias <= c.max;
  }
}

/** Airspeed is a result, not an action: being in the band before the window opens is not "early". */
const canBeEarly = (c: Check) => c.kind !== "ias";

interface StepEval { status: StepProgress["status"]; at?: number; i0?: number; i1?: number }

function evalStep(step: SeqStep, ctx: Pick<TaskContext, "samples" | "gates">, live: boolean): StepEval {
  const gates = ctx.gates ?? {};
  const n = ctx.samples.length;
  const i0 = gates[step.from];
  if (i0 == null) return { status: live ? "pending" : "missed" };
  const lead = Math.round(TIMING.leadSec * SAMPLE_HZ);
  let i1: number | undefined;
  let closed: boolean;
  if (typeof step.to === "string") {
    const g = gates[step.to];
    closed = g != null;
    i1 = g != null ? Math.max(i0, g) : undefined;
  } else {
    i1 = i0 + Math.round(step.to.sec * SAMPLE_HZ);
    closed = n - 1 >= i1;
  }
  const end = i1 ?? n - 1;
  const ok = (i: number) => i >= 0 && i < n && checkOk(step.check, ctx.samples[i]);
  if (canBeEarly(step.check) && i0 - lead >= 0 && ok(i0 - lead)) {
    let at = i0 - lead;
    while (at > 0 && ok(at - 1)) at--;
    return { status: "early", at, i0, i1 };
  }
  const first = canBeEarly(step.check) ? Math.max(0, i0 - lead) : i0;
  for (let i = first; i <= Math.min(end, n - 1); i++) if (ok(i)) return { status: "onTime", at: i, i0, i1 };
  for (let i = end + 1; i < n; i++) if (ok(i)) return { status: "late", at: i, i0, i1 };
  if (live) return { status: closed ? "overdue" : "active", i0, i1 };
  return { status: "missed", i0, i1 };
}

const sec = (i: number | undefined) => (i == null ? undefined : i / SAMPLE_HZ);

/** Grade every step of a finished run against the gates recorded in ctx. */
export function gradeSequence(spec: SequenceSpec, ctx: Pick<TaskContext, "samples" | "gates">): StepResult[] {
  return spec.steps.map((step) => {
    const e = evalStep(step, ctx, false);
    return { id: step.id, label: step.label, status: e.status as StepStatus, critical: !!step.critical, atSec: sec(e.at), fromSec: sec(e.i0), toSec: sec(e.i1) };
  });
}

/** Step states while the run is in progress, for the HUD. */
export function sequenceProgress(spec: SequenceSpec, ctx: Pick<TaskContext, "samples" | "gates">): StepProgress[] {
  return spec.steps.map((step) => {
    const e = evalStep(step, ctx, true);
    return { id: step.id, label: step.label, status: e.status, critical: !!step.critical, hint: step.hint, atSec: sec(e.at), fromSec: sec(e.i0), toSec: sec(e.i1) };
  });
}

/** No critical step missed or early, and at most one other step late or missed. */
export function sequencePasses(steps: StepResult[]): boolean {
  if (steps.some((s) => s.critical && (s.status === "missed" || s.status === "early"))) return false;
  return steps.filter((s) => s.status === "late" || s.status === "missed").length <= 1;
}

/** Flap limit speeds: Vfe for flaps 10, and the lower Vfe once past 10 degrees. Uses the actual flap position. */
export function flapSpeedFindings(limits: SequenceSpec["limits"], samples: SimSnapshot[]): Finding[] {
  let over10 = 0, over30 = 0;
  for (const s of samples) {
    const { flaps, ias } = s.readout;
    if (flaps > 10.5) { if (ias > limits.vfe30) over30 = Math.max(over30, ias); }
    else if (flaps > 0.5 && ias > limits.vfe10) over10 = Math.max(over10, ias);
  }
  const out: Finding[] = [];
  if (over30) out.push({ severity: "fail", text: `Flaps past 10 above ${limits.vfe30} kt (${over30.toFixed(0)} kt). The limit with more than 10 degrees of flap is ${limits.vfe30}.` });
  if (over10) out.push({ severity: "fail", text: `Flaps 10 above ${limits.vfe10} kt (${over10.toFixed(0)} kt).` });
  return out;
}

/** Sample range for a parameter: the whole run, or its segment between two gates. Null when the segment was never flown. */
function paramRange(p: TaskParam, ctx: TaskContext): [number, number] | null {
  const n = ctx.samples.length;
  if (!p.segment) return [0, n];
  const from = ctx.gates?.[p.segment.from];
  if (from == null) return null;
  const to = p.segment.to ? ctx.gates?.[p.segment.to] : undefined;
  return [from, to != null ? Math.max(from, to) + 1 : n];
}

export function gradeTask(task: PracticeTask, ctx: TaskContext): TaskResult {
  const params: ParamResult[] = task.params.map((p) => {
    const target = targetOf(p, ctx.entry);
    const range = paramRange(p, ctx);
    const band = Math.max(p.tolLow ?? p.tol, p.tolHigh ?? p.tol);
    if (!range) return { key: p.key, label: p.label, unit: p.unit, target, tol: band, pctInTol: 0, maxDev: 0, maxDevAtSec: 0, pass: false, series: [] };
    const start = range[0] + Math.round((p.graceSec ?? 0) * SAMPLE_HZ);
    const series: number[] = [];
    let inTol = 0, counted = 0, maxDev = 0, maxDevAt = 0;
    for (let i = range[0]; i < range[1]; i++) {
      const v = paramValue(ctx.samples[i].readout, p.key);
      series.push(v);
      if (i < start) continue;
      const d = deviation(p, v, target);
      const lo = p.tolLow ?? p.tol, hi = p.tolHigh ?? p.tol;
      const ok = d >= -lo && d <= hi;
      counted++;
      if (ok) inTol++;
      if (Math.abs(d) > Math.abs(maxDev)) { maxDev = d; maxDevAt = i / SAMPLE_HZ; }
    }
    const pct = counted ? inTol / counted : 1;
    const pass = pct >= (p.minPct ?? 0.9) && Math.abs(maxDev) <= 1.5 * band;
    return { key: p.key, label: p.label, unit: p.unit, target, tol: band, pctInTol: pct, maxDev, maxDevAtSec: maxDevAt, pass, series: decimate(series) };
  });
  const findings = task.extraFindings?.(ctx) ?? [];
  const maxG = ctx.samples.length ? Math.max(...ctx.samples.map((s) => s.readout.g)) : 1;
  const minIas = ctx.samples.length ? Math.min(...ctx.samples.map((s) => s.readout.ias)) : 0;
  if (ctx.samples.some((s) => s.readout.crashed)) findings.unshift({ severity: "fail", text: "Hit the ground." });
  if (maxG > 3.8) findings.push({ severity: "fail", text: `Exceeded 3.8 g (${maxG.toFixed(1)}).` });

  let sequence: StepResult[] | undefined;
  let ungraded = false;
  if (task.sequence) {
    if (ctx.lost) {
      ungraded = true;
      findings.unshift({ severity: "fail", text: `Pattern not recognised, so this run was not graded. ${ctx.lost}` });
    } else {
      sequence = gradeSequence(task.sequence, ctx);
      findings.push(...flapSpeedFindings(task.sequence.limits, ctx.samples));
    }
  }
  const pass = !ungraded && params.every((p) => p.pass) && !findings.some((f) => f.severity === "fail") && (!sequence || sequencePasses(sequence));
  const result: TaskResult = {
    id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    taskId: task.id, title: task.title, startedAt: new Date().toISOString(), durationSec: ctx.elapsed,
    pass, params, findings, maxG, minIas,
  };
  if (sequence) result.sequence = sequence;
  if (ctx.track?.length) result.track = decimate(ctx.track, MAX_TRACK);
  if (ctx.coached) result.coached = true;
  if (ungraded) result.ungraded = true;
  return result;
}

export interface RecorderOptions {
  /** Runway for sequence tasks: turns on leg and gate tracking. */
  runway?: RunwayFrame;
  coached?: boolean;
}

/** Records 10 Hz samples as an OutputSink and tells the app when the task is finished. */
export class ScoreRecorder implements OutputSink {
  readonly id = "score";
  readonly rateHz = SAMPLE_HZ;
  readonly ctx: TaskContext;
  done = false;
  private t0: number | null = null;
  private tracker: PatternTracker | null = null;
  onDone?: (result: TaskResult) => void;
  onSample?: (ctx: TaskContext) => void;

  constructor(readonly task: PracticeTask, entry: SimSnapshot, opts: RecorderOptions = {}) {
    this.ctx = { entry: entry.readout, samples: [], elapsed: 0, latest: entry, memo: {} };
    if (task.sequence && opts.runway) {
      this.tracker = PatternTracker.forSpec(opts.runway, task.sequence, SAMPLE_HZ);
      this.ctx.runway = opts.runway;
      this.ctx.gates = this.tracker.gates;
      this.ctx.track = [];
      this.ctx.leg = null;
    }
    if (opts.coached) this.ctx.coached = true;
  }

  /** Coach prompts are on. Sticky: once coached, the whole run counts as coached. */
  setCoached(on: boolean) { if (on) this.ctx.coached = true; }

  update(snap: SimSnapshot) {
    if (this.done || snap.paused) return;
    if (this.t0 == null) this.t0 = snap.t;
    this.ctx.elapsed = snap.t - this.t0;
    this.ctx.samples.push(snap);
    this.ctx.latest = snap;
    if (this.tracker) {
      const s = snap.state;
      this.tracker.update({ x: s.x, y: s.y, hdgRad: s.hdg, aglFt: snap.readout.agl, vsFpm: snap.readout.vs, throttle: snap.inputs.throttle, onGround: s.onGround });
      this.ctx.leg = this.tracker.leg;
      this.ctx.lost = this.tracker.lost ?? undefined;
      if ((this.ctx.samples.length - 1) % TRACK_EVERY === 0) {
        const p = toFrame(this.tracker.frame, s.x, s.y);
        this.ctx.track!.push([Math.round(p.along), Math.round(p.cross)]);
      }
    }
    this.onSample?.(this.ctx);
    const complete = this.task.isComplete(this.ctx) || !!this.ctx.lost || snap.readout.crashed || (this.task.durationSec != null && this.ctx.elapsed >= this.task.durationSec);
    if (complete) this.finish();
  }

  finish() {
    if (this.done) return;
    this.done = true;
    this.onDone?.(gradeTask(this.task, this.ctx));
  }
}
