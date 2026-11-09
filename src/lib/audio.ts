/** Stall warning horn: a reedy tone, created lazily after a user gesture. */
export class StallHorn {
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private on = false;
  enabled = true;

  private ensure() {
    if (this.ctx) return;
    const Ctor = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    if (!Ctor) return;
    this.ctx = new Ctor();
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 780;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 22;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 40;
    lfo.connect(lfoGain).connect(osc.frequency);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 900;
    filter.Q.value = 2;
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0;
    osc.connect(filter).connect(this.gain).connect(this.ctx.destination);
    osc.start();
    lfo.start();
  }

  /** Call from a pointer/keyboard event so the browser allows audio. */
  unlock() {
    this.ensure();
    this.ctx?.resume().catch(() => {});
  }

  set(on: boolean) {
    if (!this.enabled) on = false;
    if (on === this.on) return;
    this.on = on;
    if (!this.ctx || !this.gain) { if (on) this.ensure(); if (!this.gain) return; }
    const t = this.ctx!.currentTime;
    this.gain.gain.cancelScheduledValues(t);
    this.gain.gain.linearRampToValueAtTime(on ? 0.08 : 0, t + 0.05);
  }

  dispose() {
    this.ctx?.close().catch(() => {});
    this.ctx = null; this.gain = null; this.on = false;
  }
}
