/**
 * requestAnimationFrame loop with a fixed 60 Hz accumulator, input sources,
 * rate-limited output sinks and a 30 Hz UI callback. Idempotent start/stop.
 */
import { FIXED_DT, readout, step, zeroGust, type Gust } from "./engine";
import type { ControlInputs, SimSnapshot, SimState } from "./types";
import { mergeInputs } from "./io/merge";
import type { InputSource, OutputSink } from "./io/types";

const MAX_FRAME_DT = 0.1;
const UI_HZ = 30;

export interface LoopOptions { turbulence: boolean }

export class SimLoop {
  state: SimState;
  inputs: ControlInputs;
  paused = false;
  options: LoopOptions = { turbulence: false };
  onFrame?: (snap: SimSnapshot) => void;
  /** Optional per-step hook (tasks inject events such as an engine failure). */
  onStep?: (state: SimState, inputs: ControlInputs) => Partial<SimState> | null;

  private sources: InputSource[] = [];
  private sinks: OutputSink[] = [];
  private sinkNext = new Map<string, number>();
  private gust: Gust = zeroGust();
  private raf = 0;
  private last = 0;
  private acc = 0;
  private uiNext = 0;
  private running = false;
  private hiddenHandler = () => { if (document.hidden) this.last = 0; };

  constructor(init: { state: SimState; inputs: ControlInputs }) {
    this.state = init.state;
    this.inputs = init.inputs;
  }

  addSource(s: InputSource) { if (!this.sources.some((x) => x.id === s.id)) { this.sources.push(s); if (this.running) s.start(); } }
  removeSource(id: string) { const s = this.sources.find((x) => x.id === id); s?.stop(); this.sources = this.sources.filter((x) => x.id !== id); }
  addSink(s: OutputSink) { if (!this.sinks.some((x) => x.id === s.id)) { this.sinks.push(s); if (this.running) s.start?.(); } }
  removeSink(id: string) { const s = this.sinks.find((x) => x.id === id); s?.stop?.(); this.sinks = this.sinks.filter((x) => x.id !== id); this.sinkNext.delete(id); }

  start() {
    if (this.running) return;
    this.running = true;
    this.sources.forEach((s) => s.start());
    this.sinks.forEach((s) => s.start?.());
    document.addEventListener("visibilitychange", this.hiddenHandler);
    this.last = 0;
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this.raf);
    document.removeEventListener("visibilitychange", this.hiddenHandler);
    this.sources.forEach((s) => s.stop());
    this.sinks.forEach((s) => s.stop?.());
  }

  reset(init: { state: SimState; inputs: ControlInputs }) {
    this.state = init.state;
    this.inputs = init.inputs;
    this.gust = zeroGust();
    this.acc = 0;
    for (const s of this.sources) {
      const anyS = s as unknown as { sync?: (u: ControlInputs) => void; clearPersistent?: () => void };
      anyS.sync?.(init.inputs);
      anyS.clearPersistent?.();
    }
    this.emit(performance.now(), true);
  }

  setPaused(p: boolean) { this.paused = p; this.last = 0; this.emit(performance.now(), true); }
  togglePause() { this.setPaused(!this.paused); }

  snapshot(): SimSnapshot {
    return { t: this.state.t, state: this.state, readout: readout(this.state), inputs: this.inputs, paused: this.paused };
  }

  private frame = (ts: number) => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.frame);
    if (document.hidden) return;
    if (this.last === 0) { this.last = ts; return; }
    const dt = Math.min(MAX_FRAME_DT, (ts - this.last) / 1000);
    this.last = ts;
    // Inputs are polled every frame even when paused so persistent axes update.
    this.inputs = mergeInputs(this.inputs, this.sources, dt);
    if (!this.paused && !this.state.crashed) {
      this.acc += dt;
      while (this.acc >= FIXED_DT) {
        const patch = this.onStep?.(this.state, this.inputs);
        if (patch) this.state = { ...this.state, ...patch };
        this.state = step(this.state, this.inputs, FIXED_DT, { turbulence: this.options.turbulence }, this.gust);
        this.acc -= FIXED_DT;
      }
    }
    this.emit(ts, false);
  };

  private emit(ts: number, force: boolean) {
    const snap = this.snapshot();
    for (const sink of this.sinks) {
      const next = this.sinkNext.get(sink.id) ?? 0;
      if (force || ts >= next) {
        sink.update(snap);
        this.sinkNext.set(sink.id, ts + 1000 / sink.rateHz);
      }
    }
    if (force || ts >= this.uiNext) {
      this.uiNext = ts + 1000 / UI_HZ;
      this.onFrame?.(snap);
    }
  }
}
