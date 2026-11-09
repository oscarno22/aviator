import type { ControlInputs, FlapSetting } from "../types";
import { FLAP_SETTINGS } from "../types";
import type { InputSource } from "./types";

/**
 * Keyboard: arrows pitch/roll (spring-return, ramp up while held),
 * , . rudder, W/S throttle, F/V flaps down/up, T/G trim, P pause, R reset.
 * No F-keys and no Escape so it works on a Touch Bar MacBook.
 */
export class KeyboardSource implements InputSource {
  readonly id = "keyboard";
  readonly priority = 10;
  private keys = new Set<string>();
  private ele = 0; private ail = 0; private rud = 0;
  private throttle: number; private trim: number; private flaps: FlapSetting;
  private flapTapped = false; private lastFlapKey = "";
  onPause?: () => void;
  onReset?: () => void;

  constructor(initial: ControlInputs) {
    this.throttle = initial.throttle; this.trim = initial.trim; this.flaps = initial.flaps;
  }

  /** Sync persistent axes after a reset so the keyboard doesn't fight the new trim. */
  sync(u: ControlInputs) { this.throttle = u.throttle; this.trim = u.trim; this.flaps = u.flaps; }

  private onDown = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(k)) e.preventDefault();
    if (e.repeat) return;
    if (k === "p") { this.onPause?.(); return; }
    if (k === "r") { this.onReset?.(); return; }
    if (k === "f" || k === "v") {
      const i = FLAP_SETTINGS.indexOf(this.flaps);
      this.flaps = FLAP_SETTINGS[Math.max(0, Math.min(FLAP_SETTINGS.length - 1, i + (k === "f" ? 1 : -1)))];
      this.flapTapped = true; this.lastFlapKey = k;
      return;
    }
    this.keys.add(k);
  };
  private onUp = (e: KeyboardEvent) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    this.keys.delete(k);
  };
  private onBlur = () => this.keys.clear();

  start() {
    window.addEventListener("keydown", this.onDown);
    window.addEventListener("keyup", this.onUp);
    window.addEventListener("blur", this.onBlur);
  }
  stop() {
    window.removeEventListener("keydown", this.onDown);
    window.removeEventListener("keyup", this.onUp);
    window.removeEventListener("blur", this.onBlur);
    this.keys.clear();
  }

  get active() { return this.keys.size > 0; }

  poll(dt: number): Partial<ControlInputs> | null {
    const k = this.keys;
    const ramp = 0.55 * dt, decay = 3 * dt;   // ~1.8 s to full deflection: taps give small inputs
    const move = (cur: number, up: boolean, down: boolean) => {
      if (up && !down) return Math.min(1, cur + ramp);
      if (down && !up) return Math.max(-1, cur - ramp);
      return Math.abs(cur) < decay ? 0 : cur - Math.sign(cur) * decay;
    };
    this.ele = move(this.ele, k.has("ArrowDown"), k.has("ArrowUp"));
    this.ail = move(this.ail, k.has("ArrowRight"), k.has("ArrowLeft"));
    this.rud = move(this.rud, k.has("."), k.has(","));
    if (k.has("w")) this.throttle = Math.min(1, this.throttle + 0.35 * dt);
    if (k.has("s")) this.throttle = Math.max(0, this.throttle - 0.35 * dt);
    if (k.has("t")) this.trim = Math.min(1, this.trim + 0.25 * dt);
    if (k.has("g")) this.trim = Math.max(-1, this.trim - 0.25 * dt);

    const out: Partial<ControlInputs> = {};
    if (this.ele !== 0) out.elevator = this.ele;
    if (this.ail !== 0) out.aileron = this.ail;
    if (this.rud !== 0) out.rudder = this.rud;
    if (k.has("w") || k.has("s")) out.throttle = this.throttle;
    if (k.has("t") || k.has("g")) out.trim = this.trim;
    if (this.flapTapped) { out.flaps = this.flaps; this.flapTapped = false; }
    void this.lastFlapKey;
    return Object.keys(out).length ? out : null;
  }
}
