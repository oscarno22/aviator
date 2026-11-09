import type { ControlInputs } from "../types";
import { PERSISTENT, SELF_CENTERING, type InputSource } from "./types";

/** Merge polled partials by priority. Returns the new inputs (never mutates prev). */
export function mergeInputs(prev: ControlInputs, sources: InputSource[], dt: number): ControlInputs {
  const next: ControlInputs = { ...prev };
  for (const k of SELF_CENTERING) (next as unknown as Record<string, number>)[k] = 0;
  const claimed = new Map<keyof ControlInputs, number>();
  const ordered = [...sources].sort((a, b) => b.priority - a.priority);
  for (const src of ordered) {
    const part = src.poll(dt);
    if (!part) continue;
    for (const key of Object.keys(part) as (keyof ControlInputs)[]) {
      const v = part[key];
      if (v == null) continue;
      const cur = claimed.get(key);
      if (cur != null && cur > src.priority) continue;
      claimed.set(key, src.priority);
      (next as unknown as Record<string, unknown>)[key] = v;
    }
  }
  // Persistent axes not asserted this frame keep prev (already copied).
  void PERSISTENT;
  next.elevator = clamp1(next.elevator);
  next.aileron = clamp1(next.aileron);
  next.rudder = clamp1(next.rudder);
  next.trim = clamp1(next.trim);
  next.throttle = Math.min(1, Math.max(0, next.throttle));
  return next;
}

const clamp1 = (x: number) => Math.min(1, Math.max(-1, x));
