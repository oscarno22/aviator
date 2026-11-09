import type { OutputSink } from "./io/types";
import type { InstrumentReadout, SimSnapshot } from "./types";
import type { Finding, ParamKey, PracticeTask, TaskContext, TaskParam } from "./tasks";
import { angleDiff } from "@/lib/units";

export interface ParamResult {
  key: ParamKey; label: string; unit: string; target: number; tol: number;
  pctInTol: number; maxDev: number; maxDevAtSec: number; pass: boolean; series: number[];
}
export interface TaskResult {
  id: string; taskId: string; title: string; startedAt: string; durationSec: number; pass: boolean;
  params: ParamResult[]; findings: Finding[]; maxG: number; minIas: number;
}

export const SAMPLE_HZ = 10;
const MAX_SERIES = 600;

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

export function decimate(series: number[], max = MAX_SERIES): number[] {
  if (series.length <= max) return series;
  const stride = series.length / max;
  const out: number[] = [];
  for (let i = 0; i < max; i++) out.push(series[Math.floor(i * stride)]);
  return out;
}

export function gradeTask(task: PracticeTask, ctx: TaskContext): TaskResult {
  const params: ParamResult[] = task.params.map((p) => {
    const target = targetOf(p, ctx.entry);
    const start = Math.round((p.graceSec ?? 0) * SAMPLE_HZ);
    const series: number[] = [];
    let inTol = 0, counted = 0, maxDev = 0, maxDevAt = 0;
    ctx.samples.forEach((s, i) => {
      const v = paramValue(s.readout, p.key);
      series.push(v);
      if (i < start) return;
      const d = deviation(p, v, target);
      const lo = p.tolLow ?? p.tol, hi = p.tolHigh ?? p.tol;
      const ok = d >= -lo && d <= hi;
      counted++;
      if (ok) inTol++;
      const over = d < 0 ? Math.abs(d) - lo : d - hi;   // how far outside the band
      const dev = Math.max(0, over) + Math.min(lo, hi);   // comparable magnitude
      if (Math.abs(d) > Math.abs(maxDev)) { maxDev = d; maxDevAt = i / SAMPLE_HZ; }
      void dev;
    });
    const pct = counted ? inTol / counted : 1;
    const band = Math.max(p.tolLow ?? p.tol, p.tolHigh ?? p.tol);
    const pass = pct >= (p.minPct ?? 0.9) && Math.abs(maxDev) <= 1.5 * band + (p.tolLow === 0 || p.tolHigh === 0 ? 0 : 0);
    return { key: p.key, label: p.label, unit: p.unit, target, tol: band, pctInTol: pct, maxDev, maxDevAtSec: maxDevAt, pass, series: decimate(series) };
  });
  const findings = task.extraFindings?.(ctx) ?? [];
  const maxG = ctx.samples.length ? Math.max(...ctx.samples.map((s) => s.readout.g)) : 1;
  const minIas = ctx.samples.length ? Math.min(...ctx.samples.map((s) => s.readout.ias)) : 0;
  if (ctx.samples.some((s) => s.readout.crashed)) findings.unshift({ severity: "fail", text: "Hit the ground." });
  if (maxG > 3.8) findings.push({ severity: "fail", text: `Exceeded 3.8 g (${maxG.toFixed(1)}).` });
  const pass = params.every((p) => p.pass) && !findings.some((f) => f.severity === "fail");
  return {
    id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    taskId: task.id, title: task.title, startedAt: new Date().toISOString(), durationSec: ctx.elapsed,
    pass, params, findings, maxG, minIas,
  };
}

/** Records 10 Hz samples as an OutputSink and tells the app when the task is finished. */
export class ScoreRecorder implements OutputSink {
  readonly id = "score";
  readonly rateHz = SAMPLE_HZ;
  readonly ctx: TaskContext;
  done = false;
  private t0: number | null = null;
  onDone?: (result: TaskResult) => void;
  onSample?: (ctx: TaskContext) => void;

  constructor(readonly task: PracticeTask, entry: SimSnapshot) {
    this.ctx = { entry: entry.readout, samples: [], elapsed: 0, latest: entry, memo: {} };
  }

  update(snap: SimSnapshot) {
    if (this.done || snap.paused) return;
    if (this.t0 == null) this.t0 = snap.t;
    this.ctx.elapsed = snap.t - this.t0;
    this.ctx.samples.push(snap);
    this.ctx.latest = snap;
    this.onSample?.(this.ctx);
    const complete = this.task.isComplete(this.ctx) || snap.readout.crashed || (this.task.durationSec != null && this.ctx.elapsed >= this.task.durationSec);
    if (complete) this.finish();
  }

  finish() {
    if (this.done) return;
    this.done = true;
    this.onDone?.(gradeTask(this.task, this.ctx));
  }
}
