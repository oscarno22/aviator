/**
 * Serial contract with future hardware (Arduino etc.), newline-delimited JSON.
 * Host → device: state at ~10 Hz. Device → host: ctl (partial axes), hello, log, ping/pong.
 * Unknown fields are ignored; `v` only bumps on breaking changes.
 */
import type { ControlInputs, SimSnapshot } from "../types";
import { FLAP_SETTINGS } from "../types";

export const PROTOCOL_VERSION = 1;

export interface StateMessage {
  t: "state"; v: number;
  ias: number; alt: number; hdg: number; vs: number; pitch: number; bank: number;
  tr: number; ball: number; rpm: number; flaps: number; g: number;
  horn: boolean; stall: boolean; paused: boolean;
}
export interface CtlMessage { t: "ctl"; v?: number; ele?: number; ail?: number; rud?: number; thr?: number; flaps?: number; trim?: number }
export interface HelloMessage { t: "hello"; v?: number; name?: string; caps?: string[]; rate?: number; app?: string }
export interface LogMessage { t: "log"; msg: string }
export interface PingMessage { t: "ping" | "pong"; n?: number }
export type DeviceMessage = CtlMessage | HelloMessage | LogMessage | PingMessage;

const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;

export function encodeState(snap: SimSnapshot): string {
  const r = snap.readout;
  const m: StateMessage = {
    t: "state", v: PROTOCOL_VERSION,
    ias: r1(r.ias), alt: Math.round(r.alt), hdg: r1(r.hdg), vs: Math.round(r.vs),
    pitch: r1(r.pitch), bank: r1(r.bank), tr: r2(r.turnRate), ball: r2(r.ball),
    rpm: Math.round(r.rpm), flaps: Math.round(r.flaps), g: r2(r.g),
    horn: r.horn, stall: r.stalled, paused: snap.paused,
  };
  return JSON.stringify(m) + "\n";
}

export function encodeHello(rateHz: number): string {
  return JSON.stringify({ t: "hello", v: PROTOCOL_VERSION, app: "aviator", rate: rateHz }) + "\n";
}

/** Parse one line from the device. Returns null for malformed or unknown messages. */
export function parseLine(line: string): DeviceMessage | null {
  const s = line.trim();
  if (!s || s.length > 256) return null;
  let obj: unknown;
  try { obj = JSON.parse(s); } catch { return null; }
  if (!obj || typeof obj !== "object" || typeof (obj as { t?: unknown }).t !== "string") return null;
  const m = obj as Record<string, unknown>;
  switch (m.t) {
    case "ctl": {
      const out: CtlMessage = { t: "ctl" };
      for (const k of ["ele", "ail", "rud", "trim"] as const) if (isNum(m[k])) out[k] = clamp(m[k] as number, -1, 1);
      if (isNum(m.thr)) out.thr = clamp(m.thr as number, 0, 1);
      if (isNum(m.flaps)) {
        const f = m.flaps as number;
        out.flaps = FLAP_SETTINGS.reduce((best, x) => (Math.abs(x - f) < Math.abs(best - f) ? x : best), FLAP_SETTINGS[0]);
      }
      return out;
    }
    case "hello": return { t: "hello", name: str(m.name), caps: Array.isArray(m.caps) ? m.caps.filter((x): x is string => typeof x === "string") : undefined, rate: isNum(m.rate) ? (m.rate as number) : undefined };
    case "log": return { t: "log", msg: str(m.msg) ?? "" };
    case "ping": return { t: "ping", n: isNum(m.n) ? (m.n as number) : undefined };
    case "pong": return { t: "pong", n: isNum(m.n) ? (m.n as number) : undefined };
    default: return null;
  }
}

export function ctlToInputs(m: CtlMessage): Partial<ControlInputs> {
  const out: Partial<ControlInputs> = {};
  if (m.ele != null) out.elevator = m.ele;
  if (m.ail != null) out.aileron = m.ail;
  if (m.rud != null) out.rudder = m.rud;
  if (m.thr != null) out.throttle = m.thr;
  if (m.flaps != null) out.flaps = m.flaps as ControlInputs["flaps"];
  if (m.trim != null) out.trim = m.trim;
  return out;
}

const isNum = (x: unknown): boolean => typeof x === "number" && Number.isFinite(x);
const str = (x: unknown): string | undefined => (typeof x === "string" ? x.slice(0, 64) : undefined);
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Incremental line splitter for a byte/text stream. */
export class LineSplitter {
  private buf = "";
  push(chunk: string): string[] {
    this.buf += chunk;
    const parts = this.buf.split("\n");
    this.buf = parts.pop() ?? "";
    if (this.buf.length > 1024) this.buf = ""; // runaway line without newline
    return parts;
  }
}
