import type { ControlInputs } from "../types";
import type { InputSource } from "./types";

/** On-screen controls push values here; the loop polls them like any other source. */
export class TouchSource implements InputSource {
  readonly id = "touch";
  readonly priority = 20;
  private values: Partial<ControlInputs> = {};
  private stickActive = false;
  start() {}
  stop() { this.values = {}; this.stickActive = false; }

  setStick(elevator: number, aileron: number, active: boolean) {
    this.stickActive = active;
    if (active) { this.values.elevator = elevator; this.values.aileron = aileron; }
    else { delete this.values.elevator; delete this.values.aileron; }
  }
  setRudder(rudder: number | null) { if (rudder == null) delete this.values.rudder; else this.values.rudder = rudder; }
  setThrottle(t: number) { this.values.throttle = t; }
  setFlaps(f: ControlInputs["flaps"]) { this.values.flaps = f; }
  setTrim(t: number) { this.values.trim = t; }
  /** After a reset, forget persistent values so the new trim/throttle apply. */
  clearPersistent() { delete this.values.throttle; delete this.values.flaps; delete this.values.trim; }

  poll(): Partial<ControlInputs> | null {
    const out = { ...this.values };
    // Persistent axes are asserted once, then released so other sources can move them.
    delete this.values.throttle; delete this.values.flaps; delete this.values.trim;
    return Object.keys(out).length ? out : null;
  }
}
