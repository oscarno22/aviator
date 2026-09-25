export const KT_TO_MS = 0.514444;
export const MS_TO_KT = 1 / KT_TO_MS;
export const FT_TO_M = 0.3048;
export const M_TO_FT = 1 / FT_TO_M;
export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;
export const FPM_TO_MS = FT_TO_M / 60;
export const MS_TO_FPM = 1 / FPM_TO_MS;
export const NM_TO_M = 1852;
export const G = 9.80665;

export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Wrap degrees into [0, 360). */
export function wrap360(d: number): number {
  const r = d % 360;
  return r < 0 ? r + 360 : r;
}

/** Wrap radians into [0, 2π). */
export function wrapRad(r: number): number {
  const twoPi = Math.PI * 2;
  const x = r % twoPi;
  return x < 0 ? x + twoPi : x;
}

/** Signed shortest difference a − b in degrees, in (−180, 180]. */
export function angleDiff(a: number, b: number): number {
  let d = (a - b) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/** First-order lag toward target with exact discretisation (unconditionally stable). */
export function lag(current: number, target: number, tau: number, dt: number): number {
  if (tau <= 0) return target;
  return current + (target - current) * (1 - Math.exp(-dt / tau));
}

export const fmt = {
  int: (n: number) => Math.round(n).toLocaleString("en-US"),
  fixed: (n: number, d = 1) => n.toFixed(d),
  hdg: (n: number) => String(Math.round(wrap360(n)) % 360 || 360).padStart(3, "0"),
  hours: (n: number) => n.toFixed(1),
};
