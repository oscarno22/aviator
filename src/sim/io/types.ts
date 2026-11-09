import type { ControlInputs, SimSnapshot } from "../types";

/**
 * Input sources assert only the axes they currently control. Self-centering
 * axes (elevator/aileron/rudder) fall back to 0 when nothing asserts them;
 * persistent axes (throttle/flaps/trim) keep their last value.
 */
export interface InputSource {
  readonly id: string;
  /** Higher wins per asserted axis. serial 40 > gamepad 30 > touch 20 > keyboard 10. */
  readonly priority: number;
  start(): void | Promise<void>;
  stop(): void;
  poll(dtSec: number): Partial<ControlInputs> | null;
}

export interface OutputSink {
  readonly id: string;
  /** The loop throttles update() to this rate. */
  readonly rateHz: number;
  start?(): void | Promise<void>;
  stop?(): void;
  update(snapshot: SimSnapshot): void;
}

export const SELF_CENTERING: (keyof ControlInputs)[] = ["elevator", "aileron", "rudder"];
export const PERSISTENT: (keyof ControlInputs)[] = ["throttle", "flaps", "trim"];
