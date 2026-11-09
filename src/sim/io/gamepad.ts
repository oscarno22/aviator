import type { ControlInputs, FlapSetting } from "../types";
import { FLAP_SETTINGS } from "../types";
import type { InputSource } from "./types";

const DEADZONE = 0.08;
const dz = (v: number) => (Math.abs(v) < DEADZONE ? 0 : (v - Math.sign(v) * DEADZONE) / (1 - DEADZONE));

/**
 * Gamepad / joystick: left stick = aileron (x) and elevator (y, pull = nose up),
 * right stick x = rudder, axis 3 (or triggers) = throttle, A/B = flaps down/up,
 * bumpers = trim. Polled every frame; the browser only exposes a pad after a button press.
 */
export class GamepadSource implements InputSource {
  readonly id = "gamepad";
  readonly priority = 30;
  private flaps: FlapSetting; private trim: number;
  private prevButtons: boolean[] = [];
  connected = false;
  name = "";

  constructor(initial: ControlInputs) { this.flaps = initial.flaps; this.trim = initial.trim; }
  sync(u: ControlInputs) { this.flaps = u.flaps; this.trim = u.trim; }
  start() {}
  stop() {}

  poll(dt: number): Partial<ControlInputs> | null {
    if (typeof navigator === "undefined" || !navigator.getGamepads) return null;
    const pad = Array.from(navigator.getGamepads()).find((p) => p && p.connected);
    if (!pad) { this.connected = false; return null; }
    this.connected = true; this.name = pad.id;
    const ax = pad.axes;
    const out: Partial<ControlInputs> = {};
    const ail = dz(ax[0] ?? 0), ele = dz(ax[1] ?? 0), rud = dz(ax[2] ?? 0);
    if (ail) out.aileron = ail;
    if (ele) out.elevator = ele;        // stick back (+y) = nose up
    if (rud) out.rudder = rud;
    if (ax.length > 3) {
      out.throttle = (1 - (ax[3] ?? 1)) / 2;  // slider: up = full
    } else if (pad.buttons[7] || pad.buttons[6]) {
      const t = (pad.buttons[7]?.value ?? 0) - (pad.buttons[6]?.value ?? 0);
      if (t !== 0) out.throttle = Math.min(1, Math.max(0, 0.5 + t * 0.5));
    }
    const pressed = pad.buttons.map((b) => b.pressed);
    const rising = (i: number) => pressed[i] && !this.prevButtons[i];
    if (rising(0)) { this.flaps = FLAP_SETTINGS[Math.min(3, FLAP_SETTINGS.indexOf(this.flaps) + 1)]; out.flaps = this.flaps; }
    if (rising(1)) { this.flaps = FLAP_SETTINGS[Math.max(0, FLAP_SETTINGS.indexOf(this.flaps) - 1)]; out.flaps = this.flaps; }
    if (pressed[4]) { this.trim = Math.max(-1, this.trim - 0.25 * dt); out.trim = this.trim; }
    if (pressed[5]) { this.trim = Math.min(1, this.trim + 0.25 * dt); out.trim = this.trim; }
    this.prevButtons = pressed;
    return Object.keys(out).length ? out : null;
  }
}
