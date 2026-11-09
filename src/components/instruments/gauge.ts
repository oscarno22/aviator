/** Shared SVG helpers for round instruments in a 200×200 viewBox. */
export const C = 100;
export const R = 96;

/** Round to 3 decimals: server and client trig can differ in the last digit, which breaks hydration. */
export const r3 = (x: number) => Math.round(x * 1000) / 1000;

export function polar(r: number, deg: number, cx = C, cy = C) {
  const a = (deg - 90) * (Math.PI / 180);
  return { x: r3(cx + r * Math.cos(a)), y: r3(cy + r * Math.sin(a)) };
}

/** SVG arc path from angle a0 to a1 (degrees clockwise from 12 o'clock) at radius r. */
export function arcPath(r: number, a0: number, a1: number, cx = C, cy = C): string {
  const p0 = polar(r, a0, cx, cy), p1 = polar(r, a1, cx, cy);
  const sweep = a1 - a0;
  const large = Math.abs(sweep) > 180 ? 1 : 0;
  return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${r} ${r} 0 ${large} ${sweep > 0 ? 1 : 0} ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
}

export function tick(deg: number, rOuter: number, len: number, cx = C, cy = C) {
  const a = polar(rOuter, deg, cx, cy), b = polar(rOuter - len, deg, cx, cy);
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} L ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

export const FACE = "#0d1320";
export const BEZEL = "#2a3548";
export const INK = "#e6ecf5";
export const DIM = "#8a97ad";
export const NEEDLE = "#f5f7fa";
export const AMBER = "#f5b23a";
